import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { PedidoLocal } from '../../types';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatItemsForBackend } from '../../utils/formatters'; // Importante importar esto

interface Props {
  visible: boolean;
  onClose: () => void;
  pedido: PedidoLocal | null;
  indexInHistory: number;
}

export const OrderDetailModal = ({ visible, onClose, pedido, indexInHistory }: Props) => {
  const { menuIngredientes, finalizeOrderInHistory, cancelOrderInHistory, syncPedido } = useOrderStore();
  const { token } = useAuthStore();
  
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!pedido) return null;

  const getIngredientName = (id: string) => {
    return menuIngredientes.find(i => i.id === id)?.nombre || id;
  };

  // ============================================================
  // LÓGICA FINALIZAR / ENTREGAR
  // ============================================================
  const handleFinalize = async () => {
    setLoading(true);
    try {
      let remoteId = pedido.id;

      // CASO 1: No tiene ID (No sincronizado) -> CREARLO PRIMERO COMO FINALIZADO
      if (!remoteId) {
        const itemsFormateados = formatItemsForBackend(pedido.items);
        
        const payloadCreate = {
            sucursal_id: pedido.sucursal_id,
            comensal: pedido.comensal,
            productos_json: itemsFormateados,
            total: pedido.total.toString(),
            descuento: "0",
            // IMPORTANTE: Lo creamos directamente como finalizado para ahorrar un request
            estado: "finalizado", 
            estado_pago: pedido.modo_pago === 'efectivo' ? 'pendiente' : 'pagado',
            modo_pago: pedido.modo_pago,
            t_creacion: pedido.t_creacion
        };

        console.log("Creando y finalizando pedido offline...", payloadCreate);
        const resCreate = await client.post(ENDPOINTS.NUEVO_PEDIDO, payloadCreate, {
             headers: { Authorization: `Bearer ${token}` }
        });

        if (resCreate.data && resCreate.data.id) {
            remoteId = resCreate.data.id;
            // Actualizamos el ID en el store localmente para futuras referencias
            syncPedido(pedido.t_creacion, remoteId);
        }
      } 
      // CASO 2: Ya tiene ID -> ACTUALIZARLO
      else {
        console.log("Finalizando pedido existente:", remoteId);
        await client.post(ENDPOINTS.ACTUALIZA_PEDIDO, {
            id: remoteId, 
            estado: 'finalizado',
            estado_pago: 'pagado' 
         }, { headers: { Authorization: `Bearer ${token}` }});
      }
      
      // Actualizar UI Local
      finalizeOrderInHistory(indexInHistory);
      Alert.alert("Éxito", "Pedido entregado y registrado.");
      onClose();

    } catch (error) {
      console.error(error);
      Alert.alert("Modo Offline", "No se pudo conectar. Se marcó como finalizado localmente.");
      // Optimistic Update: Lo marcamos finalizado localmente aunque falle la red
      finalizeOrderInHistory(indexInHistory); 
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LÓGICA CANCELAR PEDIDO
  // ============================================================
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Requerido", "Escribe una razón para cancelar.");
      return;
    }
    setLoading(true);
    
    try {
      let remoteId = pedido.id;

      // CASO 1: No tiene ID -> CREARLO PRIMERO (Para tener registro) Y LUEGO CANCELARLO
      if (!remoteId) {
        const itemsFormateados = formatItemsForBackend(pedido.items);
        
        // 1.1 Crear Pedido (Estado: Creado)
        // No podemos crearlo como cancelado directamente si el backend requiere una razón en otro endpoint
        const payloadCreate = {
            sucursal_id: pedido.sucursal_id,
            comensal: pedido.comensal,
            productos_json: itemsFormateados,
            total: pedido.total.toString(),
            descuento: "0",
            estado: "creado", 
            modo_pago: pedido.modo_pago,
            t_creacion: pedido.t_creacion
        };

        const resCreate = await client.post(ENDPOINTS.NUEVO_PEDIDO, payloadCreate, {
             headers: { Authorization: `Bearer ${token}` }
        });

        if (resCreate.data && resCreate.data.id) {
            remoteId = resCreate.data.id;
            syncPedido(pedido.t_creacion, remoteId); // Guardar ID
        }
      }

      // CASO 2 (y continuación de 1): Cancelar usando el ID
      if (remoteId) {
          await client.post(ENDPOINTS.CANCELAR_PEDIDO, {
            id: remoteId,
            razon: cancelReason
        }, { headers: { Authorization: `Bearer ${token}` }});
      }

      // Actualizar UI Local
      cancelOrderInHistory(indexInHistory);
      Alert.alert("Cancelado", "El pedido ha sido cancelado en el sistema.");
      onClose();

    } catch (error) {
       console.error(error);
       Alert.alert("Error / Offline", "Se marcó como cancelado localmente. Se intentará sincronizar después.");
       cancelOrderInHistory(indexInHistory);
       onClose();
    } finally {
      setLoading(false);
      setShowCancelInput(false);
      setCancelReason('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
       {/* ... (Resto del render del modal UI se mantiene igual) ... */}
       <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
                <Text style={styles.title}>Detalle: {pedido.comensal}</Text>
                <Text style={styles.subtitle}>{new Date(pedido.t_creacion).toLocaleString()}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={30} color={COLORS.salsa} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body}>
            {pedido.items.map((item, idx) => (
                <View key={idx} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>Platanada #{idx + 1} - <Text style={{fontWeight:'normal'}}>${item.precioCalculado.toLocaleString('es-CO')}</Text></Text>
                    <View style={styles.ingredientesList}>
                        {Object.entries(item.ingredientes).map(([id, qty]) => (
                            <Text key={id} style={styles.ingredienteText}>
                                • {qty}x {getIngredientName(id)}
                            </Text>
                        ))}
                    </View>
                </View>
            ))}
             <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total ({pedido.modo_pago})</Text>
                <Text style={styles.totalValue}>${pedido.total.toLocaleString('es-CO')}</Text>
            </View>
          </ScrollView>

          {/* Footer Acciones */}
          {pedido.estado !== 'cancelado' && pedido.estado !== 'finalizado' && (
              <View style={styles.footer}>
                  {!showCancelInput ? (
                      <>
                        <TouchableOpacity style={styles.btnCancel} onPress={() => setShowCancelInput(true)}>
                            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                            <Text style={styles.btnCancelText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnFinalize} onPress={handleFinalize} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff"/> : (
                                <>
                                    <Text style={styles.btnFinalizeText}>Finalizar / Entregar</Text>
                                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                      </>
                  ) : (
                      <View style={styles.cancelInputContainer}>
                          <TextInput 
                            style={styles.input} 
                            placeholder="Razón cancelación..." 
                            value={cancelReason}
                            onChangeText={setCancelReason}
                          />
                          <View style={styles.miniActions}>
                            <TouchableOpacity onPress={() => setShowCancelInput(false)} style={styles.miniBtn}>
                                <Text>Atrás</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCancel} style={[styles.miniBtn, {backgroundColor: COLORS.danger}]}>
                                <Text style={{color:'#fff'}}>Confirmar</Text>
                            </TouchableOpacity>
                          </View>
                      </View>
                  )}
              </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  container: { width: '85%', maxHeight:'80%', backgroundColor: COLORS.cream, borderRadius: 20, padding: 20, ...SHADOWS.card },
  header: { flexDirection:'row', justifyContent:'space-between', marginBottom: 15, borderBottomWidth:1, borderColor: COLORS.verdePintonTrans, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight:'bold', color: COLORS.salsa },
  subtitle: { color: COLORS.salsaBrown },
  body: { marginBottom: 20 },
  itemCard: { backgroundColor:'#fff', padding:15, borderRadius:10, marginBottom:10, borderWidth:1, borderColor: COLORS.stroke },
  itemTitle: { fontWeight:'bold', color: COLORS.salsa, marginBottom: 5 },
  ingredientesList: { paddingLeft: 10 },
  ingredienteText: { color: COLORS.salsaBrown, fontSize: 14 },
  totalContainer: { marginTop: 10, alignItems: 'flex-end' },
  totalLabel: { fontSize: 12, color: COLORS.salsaBrown },
  totalValue: { fontSize: 24, fontWeight:'bold', color: COLORS.salsa },
  footer: { flexDirection: 'row', gap: 15, height: 60 },
  btnCancel: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', borderColor: COLORS.danger, borderWidth:2, borderRadius:10, gap:5 },
  btnCancelText: { color: COLORS.danger, fontWeight:'bold' },
  btnFinalize: { flex:2, flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor: COLORS.verdePinton, borderRadius:10, gap:5, ...SHADOWS.button },
  btnFinalizeText: { color: '#fff', fontWeight:'bold' },
  cancelInputContainer: { flex:1 },
  input: { borderWidth:1, borderColor: COLORS.stroke, borderRadius:8, padding:8, backgroundColor:'#fff', marginBottom:5 },
  miniActions: { flexDirection:'row', justifyContent:'space-between' },
  miniBtn: { padding: 8, borderRadius: 5, backgroundColor: '#eee' }
});