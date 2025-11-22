import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import { PedidoLocal } from '../types';
import { OrderDetailModal } from '../components/history/OrderDetailModal'; // Importa el modal
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { formatItemsForBackend } from '../utils/formatters';

export const HistoryScreen = () => {
  const { history, syncPedido } = useOrderStore();
  const { token } = useAuthStore();

  // Estado para el modal
  const [selectedPedido, setSelectedPedido] = useState<{item: PedidoLocal, index: number} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // LOGICA DE SINCRONIZACIÓN
const handleSync = async () => {
    // Filtramos SOLO los pedidos que no tienen ID (nunca subieron al servidor)
    const pedidosPendientes = history.filter(p => !p.id); 
    
    if (pedidosPendientes.length === 0) {
        Alert.alert("Sincronizado", "Todo está al día.");
        return;
    }

    setIsSyncing(true);
    let createdCount = 0;
    let updatedCount = 0; // Cancelados o finalizados post-sync

    for (const pedido of pedidosPendientes) {
        try {
            const itemsFormateados = formatItemsForBackend(pedido.items);

            // 1. PREPARAR PAYLOAD DE CREACIÓN
            // Si el pedido localmente ya está 'finalizado', lo enviamos así para ahorrar un request.
            // Si está 'cancelado', debemos crearlo como 'creado' primero, porque 'cancelar' requiere una razón y otro endpoint.
            const estadoInicial = pedido.estado === 'cancelado' ? 'creado' : pedido.estado;

            const payload = {
               comensal: pedido.comensal,
               productos_json: itemsFormateados,
               total: pedido.total.toString(),
               descuento: "0",
               estado: estadoInicial, // 'creado' o 'finalizado'
               estado_pago: pedido.modo_pago === 'efectivo' ? 'pendiente' : 'pagado',
               modo_pago: pedido.modo_pago,
               t_creacion: pedido.t_creacion
            };

            // 2. LLAMADA CREAR
            const res = await client.post(ENDPOINTS.NUEVO_PEDIDO, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.id) {
                const newId = res.data.id;
                syncPedido(pedido.t_creacion, newId); // Guardar ID
                createdCount++;

                // 3. MANEJAR ESTADO "CANCELADO" DIFERIDO
                // Si localmente estaba cancelado, ahora que tenemos ID, llamamos al endpoint de cancelar
                if (pedido.estado === 'cancelado') {
                    await client.post(ENDPOINTS.CANCELAR_PEDIDO, {
                        id: newId,
                        razon: "Sincronización diferida (Cancelado Offline)"
                    }, { headers: { Authorization: `Bearer ${token}` }});
                    updatedCount++;
                }
            }
        } catch (error) {
            console.error(`Error sync pedido ${pedido.comensal}:`, error);
        }
    }

    setIsSyncing(false);
    Alert.alert("Sincronización Completada", `Se subieron ${createdCount} pedidos.`);
  };

  const renderPedido = ({ item, index }: { item: PedidoLocal, index: number }) => {
    const fecha = new Date(item.t_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isSynced = !!item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.comensal.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
                <Text style={styles.comensal}>{item.comensal}</Text>
                <Text style={styles.details}>
                    {item.items.length} Platanadas • {fecha}
                    {!isSynced && <Text style={{color: COLORS.danger, fontSize:10}}> (Sin subir)</Text>}
                </Text>
            </View>
        </View>

        <View style={styles.cardRight}>
            <Text style={styles.total}>${item.total.toLocaleString('es-CO')}</Text>
            
            <View style={[
                styles.statusBadge, 
                item.estado === 'finalizado' ? styles.statusDone : 
                item.estado === 'cancelado' ? {backgroundColor: COLORS.danger} : styles.statusPending
            ]}>
                <Text style={[styles.statusText, item.estado === 'cancelado' && {color:'#fff'}]}>
                    {item.estado.toUpperCase()}
                </Text>
            </View>

            <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => setSelectedPedido({ item, index })}
            >
                <Ionicons name="chevron-forward-circle" size={32} color={COLORS.salsa} />
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial del Día</Text>
        
        <TouchableOpacity style={styles.syncBtn} onPress={handleSync} disabled={isSyncing}>
            {isSyncing ? <ActivityIndicator color="#fff" /> : <Ionicons name="cloud-upload" size={24} color="#fff" />}
            <Text style={styles.syncText}>{isSyncing ? 'Subiendo...' : 'Sincronizar'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={history}
        keyExtractor={(item, index) => index.toString()} // Mejor usar un UUID si lo tienes
        renderItem={renderPedido}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={/* ...mismo codigo existente... */ <View></View>}
      />

      {/* MODAL DETALLE */}
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
  syncBtn: {
    backgroundColor: COLORS.salsa,
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  syncText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    gap: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.banana,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  comensal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  details: {
    color: COLORS.salsaBrown,
    fontSize: 14,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: COLORS.amarilloMaduro,
  },
  statusDone: {
    backgroundColor: COLORS.verdePinton,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  actionBtn: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.salsaBrown,
    fontSize: 16,
  }
});