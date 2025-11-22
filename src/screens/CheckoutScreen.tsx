import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SHADOWS } from '../constants/theme';
import { useOrderStore } from '../store/useOrderStore';
import axios from 'axios'; // Asegúrate de npm install axios
import { useAuthStore } from '../store/useAuthStore';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { formatItemsForBackend } from '../utils/formatters'; // Importa el formatter
// Definición de métodos de pago según tu backend
const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: 'cash-outline' },
  { id: 'billeteras', label: 'Digital / QR', icon: 'qr-code-outline' },
  { id: 'tarjeta', label: 'Tarjeta', icon: 'card-outline' },
];

export const CheckoutScreen = () => {
  const { token } = useAuthStore();
  const navigation = useNavigation<any>();
  const { currentOrder, menuIngredientes, getOrderTotal, clearCurrentOrder, addToHistory } = useOrderStore();

  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular total general
  const totalPedido = getOrderTotal();

  // Generar resumen de texto de ingredientes para una platanada
  const getSummaryText = (ingredientesQty: { [id: string]: number }) => {
    const names = Object.keys(ingredientesQty).map(id => {
      const ing = menuIngredientes.find(i => i.id === id);
      // Si la cantidad es > 1, mostrar (x2)
      const qty = ingredientesQty[id];
      return ing ? `${ing.nombre}${qty > 1 ? ` (x${qty})` : ''}` : id;
    });
    return names.join(', ');
  };

  const handleConfirmOrder = async () => {
    if (!currentOrder) return;

    setIsSubmitting(true);

    // 1. Preparamos el objeto para guardar LOCALMENTE primero (Optimistic UI)
    // Esto asegura que si falla la red, ya tenemos los datos base.
    const itemsFormateados = formatItemsForBackend(currentOrder.items);

    const pedidoLocalFinal = {
      ...currentOrder,
      total: totalPedido,
      modo_pago: paymentMethod as any,
      estado: 'creado' as const,
      // Guardamos la estructura visual para el historial local
      items: currentOrder.items
    };

    try {
      // 2. Construir Payload exacto para Go
      const payload = {
        sucursal_id: currentOrder.sucursal_id,
        comensal: currentOrder.comensal,
        // Aquí usamos el array de strings ["ing1,ing2", "ing3"]
        productos_json: itemsFormateados,
        total: totalPedido.toString(), // Go espera string en el JSON example
        descuento: "0",
        estado: "creado",
        estado_pago: paymentMethod === 'efectivo' ? 'pendiente' : 'pagado',
        modo_pago: paymentMethod,
        // Enviamos la fecha de creación original
        t_creacion: currentOrder.t_creacion
      };

      console.log("Enviando Payload:", JSON.stringify(payload, null, 2));

      // 3. Enviar al Backend
      const response = await client.post(ENDPOINTS.NUEVO_PEDIDO, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Respuesta Backend:", response.data);

      // Si hay éxito, asignamos el ID real del servidor
      if (response.data && response.data.id) {
        pedidoLocalFinal.id = response.data.id;
      }

      Alert.alert("¡Pedido Exitoso!", "La orden ha sido enviada a cocina.");

    } catch (error: any) {
      console.error("Error al enviar:", error);
      // Diferenciar error de red vs error de backend (400/500)
      if (error.response) {
        // El servidor respondió con un error (ej: 400 Bad Request por mal formato)
        Alert.alert("Error del Servidor", `Código: ${error.response.status}. Guardado localmente.`);
      } else {
        // Error de red real
        Alert.alert("Modo Offline", "No se pudo conectar. El pedido se guardó localmente. Recuerda sincronizar más tarde.");
      }
      // En ambos casos, el pedido se guarda localmente SIN ID, para sincronizar luego.
    } finally {
      // 4. Guardar en Historial y Navegar
      addToHistory(pedidoLocalFinal);
      clearCurrentOrder();
      setIsSubmitting(false);

      // CORRECCIÓN DE NAVEGACIÓN: Usar reset para volver al Inicio (Tab) limpiando el stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }], // Navega al Tab Navigator principal
        })
      );
    }
  };

  if (!currentOrder) return null;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.salsa} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout: {currentOrder.comensal}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Panel Izquierdo: Lista de Platanadas */}
        <View style={styles.summaryPanel}>
          <Text style={styles.sectionTitle}>Resumen de Platanadas</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {currentOrder.items.map((item, index) => (
              <View key={item.uuid} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.cardPrice}>${item.precioCalculado.toLocaleString('es-CO')}</Text>
                </View>
                <Text style={styles.cardBody} numberOfLines={3}>
                  {getSummaryText(item.ingredientes) || "Sin ingredientes seleccionados"}
                </Text>

                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    // Lógica para ir a editar esta platanada específica
                    // useOrderStore.getState().selectPlatanadaTab(index);
                    navigation.navigate('Builder');
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.verdePinton} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Panel Derecho: Pago y Confirmación */}
        <View style={styles.paymentPanel}>

          {/* Métodos de Pago */}
          <View>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    paymentMethod === method.id && styles.methodCardActive
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={32}
                    color={paymentMethod === method.id ? COLORS.verdePinton : COLORS.salsa}
                  />
                  <Text style={[
                    styles.methodLabel,
                    paymentMethod === method.id && styles.methodLabelActive
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Acciones Finales */}
          <View style={styles.footerActions}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a Pagar</Text>
              <Text style={styles.totalValue}>${totalPedido.toLocaleString('es-CO')}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  Alert.alert("¿Cancelar Pedido?", "Se perderá toda la información actual.", [
                    { text: "No" },
                    {
                      text: "Sí, borrar", style: 'destructive', onPress: () => {
                        clearCurrentOrder();
                        navigation.dispatch(
                          CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Main' }],
                          })
                        );
                      }
                    }
                  ])
                }}
              >
                <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
                <Text style={styles.deleteText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleConfirmOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.confirmText}>Confirmar Pedido</Text>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: COLORS.verdePintonTrans,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  content: {
    flex: 1,
    flexDirection: 'row', // Layout horizontal split
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.salsaBrown,
    marginBottom: 15,
  },

  // Panel Izquierdo
  summaryPanel: {
    flex: 3, // 60% del ancho
    padding: 20,
    borderRightWidth: 1,
    borderColor: COLORS.stroke,
    backgroundColor: COLORS.creamAlt,
  },
  scrollContent: {
    gap: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.verdePintonTrans,
    ...SHADOWS.card,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: COLORS.verdePinton,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  cardBody: {
    fontSize: 14,
    color: COLORS.salsaBrown,
    lineHeight: 20,
    paddingRight: 30, // espacio para btn edit
  },
  editBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    padding: 5,
  },

  // Panel Derecho
  paymentPanel: {
    flex: 2, // 40% del ancho
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderWidth: 2,
    borderColor: COLORS.stroke,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  methodCardActive: {
    borderColor: COLORS.verdePinton,
    backgroundColor: COLORS.creamAlt,
  },
  methodLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.salsa,
  },
  methodLabelActive: {
    color: COLORS.verdePinton,
  },

  // Footer Actions
  footerActions: {
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 15,
  },
  totalLabel: {
    fontSize: 18,
    color: COLORS.salsaBrown,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.salsa,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.danger,
    backgroundColor: '#fff',
  },
  deleteText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  confirmBtn: {
    flex: 2, // Botón más grande
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.verdePinton,
    ...SHADOWS.button,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
});