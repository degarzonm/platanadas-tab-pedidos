import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import { PedidoLocal } from '../types';
import { OrderDetailModal } from '../components/history/OrderDetailModal';

// --- UTILIDAD PARA FORMATEAR FECHAS ---
const getFriendlyDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Resetear horas para comparar días puros
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const isToday = d1.getTime() === d2.getTime();

  // Opciones para: "Domingo 24 de Nov. 2025"
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  // Formato base en español
  let text = date.toLocaleDateString('es-ES', options);
  
  // Capitalizar primera letra (ej: "domingo" -> "Domingo")
  text = text.charAt(0).toUpperCase() + text.slice(1);

  if (isToday) {
    return `Hoy, ${text}`;
  }
  return text;
};

// --- COMPONENTE INTERNO PARA GRUPOS COLAPSABLES ---
const DateSection = ({ 
  title, 
  orders, 
  renderItem 
}: { 
  title: string, 
  orders: PedidoLocal[], 
  renderItem: (item: PedidoLocal, index: number) => React.ReactNode 
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.sectionContainer}>
      {/* Header Amarillo */}
      <TouchableOpacity 
        style={styles.sectionHeader} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons 
          name={expanded ? "chevron-down" : "chevron-forward"} 
          size={24} 
          color={COLORS.salsa} 
        />
      </TouchableOpacity>

      {/* Lista de Pedidos (Visible si expanded es true) */}
      {expanded && (
        <View style={styles.sectionList}>
          {orders.map((order, idx) => (
             <React.Fragment key={order.id || order.t_creacion || idx}>
                {renderItem(order, idx)}
             </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
};

export const HistoryScreen = () => {
  const { logout } = useAuthStore();
  // Nota: Para limpiar persistencia, accedemos a la API de persist de Zustand
  const { history, syncHistory, isSyncing, setDatosDia, resetStore } = useOrderStore();
  const [selectedPedido, setSelectedPedido] = useState<{ item: PedidoLocal, index: number } | null>(null);

  // --- LÓGICA DE REINICIO ---
const handleResetApp = () => {
    Alert.alert(
      "⚠️ Reiniciar POS",
      "Esto borrará TODOS los pedidos locales y cerrará la sesión.\n\n¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, Borrar Todo", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 1. Limpiar memoria RAM (Zustand) -> ARREGLA EL BUG DEL ZOMBIE DATA
              resetStore();

              // 2. Limpiar Disco (AsyncStorage)
              await useOrderStore.persist.clearStorage();
              
              // 3. Logout (Auth Store)
              logout();
            } catch (e) {
              console.error("Error reseteando", e);
            }
          }
        }
      ]
    );
  };

  const handleSync = async () => {
    await syncHistory();
  };

  // --- AGRUPACIÓN DE DATOS ---
  // Usamos useMemo para no recalcular en cada render si history no cambia
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: PedidoLocal[] } = {};
    
    history.forEach(order => {
      // Usamos la fecha formateada como clave única del grupo
      const dateKey = getFriendlyDate(order.t_creacion);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });

    // Convertir objeto a array para iterar
    return Object.entries(groups).map(([title, orders]) => ({ title, orders }));
  }, [history]);


  const renderPedidoCard = (item: PedidoLocal, index: number) => {
    const fecha = new Date(item.t_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isSynced = !!item.id;

    return (
      <TouchableOpacity
        key={index} // Importante para el map dentro de DateSection
        style={styles.card}
        onPress={() => setSelectedPedido({ item, index })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.comensal.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.comensal} numberOfLines={1}>{item.comensal}</Text>
            <Text style={styles.details} numberOfLines={1}>
              {item.items.length} Plat. • {fecha}
              {!isSynced && <Text style={{ color: COLORS.danger, fontSize: 10 }}> (Sin subir)</Text>}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.total}>${item.total.toLocaleString('es-CO')}</Text>
          <View style={[
            styles.statusBadge,
            item.estado === 'finalizado' ? styles.statusDone :
              item.estado === 'cancelado' ? { backgroundColor: COLORS.danger } : styles.statusPending
          ]}>
            <Text style={[styles.statusText, item.estado === 'cancelado' && { color: '#fff' }]}>
              {item.estado.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>

        <View style={styles.headerActions}>
           {/* BOTÓN REINICIAR */}
           <TouchableOpacity 
            style={styles.resetBtn} 
            onPress={handleResetApp}
          >
            <Ionicons name="trash-bin-outline" size={20} color={COLORS.danger} />
            <Text style={styles.resetText}>Reiniciar</Text>
          </TouchableOpacity>

          {/* BOTÓN SYNC */}
          <TouchableOpacity
            style={[styles.syncBtn, isSyncing && { opacity: 0.7 }]}
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="cloud-upload" size={20} color="#fff" />
            )}
            <Text style={styles.syncText}>
              {isSyncing ? '...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {groupedHistory.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No hay pedidos registrados aún.</Text>
          </View>
        ) : (
          groupedHistory.map((group) => (
            <DateSection 
              key={group.title}
              title={group.title}
              orders={group.orders}
              renderItem={renderPedidoCard}
            />
          ))
        )}
      </ScrollView>

      <OrderDetailModal
        visible={!!selectedPedido}
        pedido={selectedPedido ? selectedPedido.item : null}
        indexInHistory={selectedPedido ? selectedPedido.index : -1}
        onClose={() => setSelectedPedido(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: COLORS.stroke,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  // ESTILOS BOTÓN RESET
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: '#fff',
    gap: 5,
  },
  resetText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 12,
  },
  // ESTILOS BOTÓN SYNC
  syncBtn: {
    backgroundColor: COLORS.salsa,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 5,
    ...SHADOWS.button,
  },
  syncText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  
  // SCROLL CONTENT
  scrollContent: {
    paddingBottom: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.salsaBrown,
    fontSize: 16,
  },

  // --- SECCIONES POR FECHA ---
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    backgroundColor: COLORS.banana, // Amarillo similar al de la imagen
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    // Sombra sutil para dar efecto de "sticker" o separador
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18, // Texto grande y legible como marcador
    fontWeight: 'bold', // Estilo "Marker" visualmente
    color: COLORS.salsa, // Contraste oscuro sobre amarillo
    fontFamily: 'Fredoka-Regular', // Usamos tu fuente si está disponible
  },
  sectionList: {
    paddingHorizontal: 15, // Padding para las tarjetas internas
    paddingTop: 10,
    gap: 10,
  },

  // --- TARJETAS DE PEDIDO (Ajustadas para encajar en el grupo) ---
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.card,
    marginBottom: 5, // Separación entre tarjetas
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.creamAlt, // Un poco más suave que el header
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.banana,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  comensal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  details: {
    color: COLORS.salsaBrown,
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 80,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: COLORS.amarilloMaduro,
  },
  statusDone: {
    backgroundColor: COLORS.verdePinton,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
});