import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SHADOWS } from '../constants/theme';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { formatItemsForBackend } from '../utils/formatters';

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: 'cash-outline' },
  { id: 'billeteras', label: 'Digital / QR', icon: 'qr-code-outline' },
  { id: 'tarjeta', label: 'Tarjeta', icon: 'card-outline' },
];

export const CheckoutScreen = () => {
  const navigation = useNavigation<any>();
  const { currentOrder, menuIngredientes, getOrderTotal, clearCurrentOrder, addToHistory } = useOrderStore();
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Breakpoint para Tablet

  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPedido = getOrderTotal();

  const getSummaryText = (ingredientesQty: { [id: string]: number }) => {
    const names = Object.keys(ingredientesQty).map(id => {
      const ing = menuIngredientes.find(i => i.id === id);
      const qty = ingredientesQty[id];
      return ing ? `${ing.nombre}${qty > 1 ? ` (x${qty})` : ''}` : id;
    });
    return names.join(', ');
  };

  const handleConfirmOrder = async () => {
    if (!currentOrder) return;
    setIsSubmitting(true);

    const itemsFormateados = formatItemsForBackend(currentOrder.items);
    const pedidoLocalFinal = {
      ...currentOrder,
      total: totalPedido,
      modo_pago: paymentMethod as any,
      estado: 'creado' as const,
      items: currentOrder.items
    };

    try {
      const payload = {
        sucursal_id: currentOrder.sucursal_id,
        comensal: currentOrder.comensal,
        productos_json: itemsFormateados,
        total: totalPedido.toString(),
        descuento: "0",
        estado: "creado",
        estado_pago: paymentMethod === 'efectivo' ? 'pendiente' : 'pagado',
        modo_pago: paymentMethod,
        t_creacion: currentOrder.t_creacion
      };

      const response = await client.post(ENDPOINTS.NUEVO_PEDIDO, payload);

      if (response.data && response.data.id) {
        pedidoLocalFinal.id = response.data.id;
      }
      Alert.alert("¡Pedido Exitoso!", "La orden ha sido enviada a cocina.");

    } catch (error: any) {
      console.error("Error al enviar:", error);
      Alert.alert("Modo Offline", "No se pudo conectar. El pedido se guardó localmente.");
    } finally {
      addToHistory(pedidoLocalFinal);
      clearCurrentOrder();
      setIsSubmitting(false);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    }
  };

  // --- COMPONENTES INTERNOS PARA REUTILIZAR ---

  const SummaryList = () => (
    <>
      {currentOrder?.items.map((item, index) => (
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
            onPress={() => navigation.navigate('Builder')}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.verdePinton} />
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const PaymentSection = () => (
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

      <View style={styles.footerActions}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a Pagar</Text>
          <Text style={styles.totalValue}>${totalPedido.toLocaleString('es-CO')}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Alert.alert("¿Cancelar Pedido?", "Se perderá todo.", [
                { text: "No" },
                { text: "Sí, borrar", style: 'destructive', onPress: () => {
                    clearCurrentOrder();
                    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
                  }
                }
              ])
            }}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
            <Text style={styles.btnLabel}>Cancelar</Text>
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
                <Text style={styles.confirmText}>Confirmar</Text>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!currentOrder) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Fijo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.salsa} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout: {currentOrder.comensal}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isMobile ? (
        // ================= MÓVIL (VERTICAL SCROLL COMPLETO) =================
        // SOLUCIÓN: Un solo ScrollView con MUCHO padding bottom para que los botones suban
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }} 
        >
          <View style={{ marginBottom: 30 }}>
             <Text style={styles.sectionTitle}>Resumen de Platanadas</Text>
             <View style={{ gap: 15 }}>
               <SummaryList />
             </View>
          </View>
          
          <View style={styles.divider} />
          
          <PaymentSection />
        </ScrollView>
      ) : (
        // ================= TABLET (SPLIT VIEW) =================
        // SOLUCIÓN: Panel Izquierdo con Scroll, Panel Derecho FIJO (sin scroll)
        <View style={styles.tabletContainer}>
          
          {/* IZQUIERDA: Lista Scrollable */}
          <View style={styles.leftPanel}>
            <Text style={styles.sectionTitle}>Resumen de Platanadas</Text>
            <ScrollView contentContainerStyle={{ gap: 15, paddingBottom: 20 }}>
              <SummaryList />
            </ScrollView>
          </View>

          {/* DERECHA: Panel Fijo */}
          <View style={styles.rightPanel}>
            <PaymentSection />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderColor: COLORS.verdePintonTrans, 
    backgroundColor: '#fff',
    zIndex: 10 
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.salsa },

  // Estilos Generales
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.salsaBrown, marginBottom: 15 },
  divider: { height: 1, backgroundColor: COLORS.stroke, opacity: 0.2, marginVertical: 20 },

  // Estilos de Tarjetas (Items)
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: COLORS.verdePintonTrans, ...SHADOWS.card, position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { backgroundColor: COLORS.verdePinton, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.salsa },
  cardBody: { fontSize: 14, color: COLORS.salsaBrown, lineHeight: 20, paddingRight: 30 },
  editBtn: { position: 'absolute', right: 10, bottom: 10, padding: 5 },

  // Estilos Pago
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: { width: '48%', aspectRatio: 1.2, borderWidth: 2, borderColor: COLORS.stroke, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  methodCardActive: { borderColor: COLORS.verdePinton, backgroundColor: COLORS.creamAlt },
  methodLabel: { marginTop: 8, fontSize: 12, fontWeight: '600', color: COLORS.salsa },
  methodLabelActive: { color: COLORS.verdePinton },

  // Footer Actions
  footerActions: { marginTop: 30 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderTopWidth: 1, borderColor: '#eee', paddingTop: 15 },
  totalLabel: { fontSize: 18, color: COLORS.salsaBrown },
  totalValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.salsa },
  actionButtons: { flexDirection: 'row', gap: 15 },
  
  deleteBtn: { 
    flex: 1, 
    flexDirection: 'column', // Icono arriba texto abajo para ahorrar espacio horizontal
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: COLORS.danger, 
    backgroundColor: '#fff' 
  },
  btnLabel: { fontSize: 10, color: COLORS.danger, fontWeight: 'bold', marginTop: 4 },

  confirmBtn: { 
    flex: 3, // Botón confirmar más ancho
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 15, 
    borderRadius: 12, 
    backgroundColor: COLORS.verdePinton, 
    ...SHADOWS.button 
  },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginRight: 10 },

  // Layout Tablet (Split View)
  tabletContainer: { flex: 1, flexDirection: 'row' },
  leftPanel: { flex: 3, padding: 20, backgroundColor: COLORS.creamAlt, borderRightWidth: 1, borderColor: COLORS.stroke },
  rightPanel: { flex: 2, padding: 20, backgroundColor: '#fff', justifyContent: 'center' }
});