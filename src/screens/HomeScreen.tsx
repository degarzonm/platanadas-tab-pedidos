import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useOrderStore } from '../store/useOrderStore';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { currentOrder, initOrder, getOrderTotal } = useOrderStore();
    const { width } = useWindowDimensions();
    const isMobile = width < 768; // Breakpoint Tablet

    const [isModalVisible, setModalVisible] = useState(false);
    const [alias, setAlias] = useState('');

    const handleNewOrder = () => {
        if (currentOrder) {
            Alert.alert(
                "Orden en Curso",
                "Ya tienes un pedido abierto. ¿Deseas continuarlo o descartarlo?",
                [
                    { text: "Descartar", style: 'destructive', onPress: () => { setModalVisible(true); /* TODO: Limpiar store si necesario */ } },
                    { text: "Continuar", onPress: () => navigation.navigate('Builder') }
                ]
            );
        } else {
            setModalVisible(true);
        }
    };

    const confirmCreateOrder = () => {
        if (!alias.trim()) return;
        initOrder(alias, 'bosque_popular');
        setModalVisible(false);
        setAlias('');
        navigation.navigate('Builder');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Hola, Cajero 👋</Text>
                    <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}>
                {/* Botón Gigante: NUEVO PEDIDO */}
                <TouchableOpacity 
                    style={[styles.newOrderBtn, isMobile && styles.newOrderBtnMobile]} 
                    onPress={handleNewOrder}
                >
                    <View style={[styles.iconCircle, isMobile && {width: 70, height: 70}]}>
                        <Ionicons name="restaurant" size={isMobile ? 30 : 50} color={COLORS.cream} />
                    </View>
                    <Text style={[styles.newOrderText, isMobile && {fontSize: 24}]}>Nuevo Pedido</Text>
                </TouchableOpacity>

                {/* Card: Pedido Activo */}
                {currentOrder && (
                    <View style={[styles.activeOrderCard, isMobile && {width: '100%'}]}>
                        <View style={styles.activeHeader}>
                            <Text style={styles.activeLabel}>🔴 Pedido en Curso</Text>
                            <Ionicons name="time" size={20} color={COLORS.danger} />
                        </View>
                        <Text style={styles.clientName}>{currentOrder.comensal}</Text>
                        <Text style={styles.itemsCount}>{currentOrder.items.length} Platanadas</Text>
                        <Text style={styles.totalPrice}>${getOrderTotal().toLocaleString('es-CO')}</Text>

                        <TouchableOpacity
                            style={styles.resumeBtn}
                            onPress={() => navigation.navigate('Builder')}
                        >
                            <Text style={styles.resumeText}>Continuar Editando</Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Modal */}
            <Modal transparent visible={isModalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { width: isMobile ? '90%' : 400 }]}>
                        <Text style={styles.modalTitle}>Nombre del Comensal</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Juan, Mesa 4..."
                            value={alias}
                            onChangeText={setAlias}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmCreateOrder} style={styles.confirmBtn}>
                                <Text style={styles.confirmText}>Crear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.cream },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    welcome: { fontSize: 24, fontWeight: 'bold', color: COLORS.salsa },
    date: { fontSize: 16, color: COLORS.salsaBrown },
    
    content: { padding: 20, flexDirection: 'row', gap: 30, alignItems: 'flex-start' },
    contentMobile: { flexDirection: 'column', gap: 20 },

    newOrderBtn: { flex: 1, minHeight: 300, width: '100%', backgroundColor: COLORS.verdePinton, borderRadius: 20, justifyContent: 'center', alignItems: 'center', ...SHADOWS.button },
    newOrderBtnMobile: { minHeight: 180, flex: 0 }, // Más pequeño en móvil

    iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    newOrderText: { fontSize: 32, fontWeight: 'bold', color: COLORS.cream },

    activeOrderCard: { width: 300, backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: COLORS.guavaCoral, ...SHADOWS.card },
    activeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    activeLabel: { color: COLORS.guavaCoral, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12 },
    clientName: { fontSize: 24, fontWeight: 'bold', color: COLORS.salsa, marginBottom: 5 },
    itemsCount: { fontSize: 16, color: COLORS.salsaBrown },
    totalPrice: { fontSize: 28, fontWeight: 'bold', color: COLORS.salsa, marginVertical: 15 },
    resumeBtn: { backgroundColor: COLORS.salsa, padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    resumeText: { color: '#fff', fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: COLORS.cream, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: COLORS.verdePinton },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.salsa, marginBottom: 20 },
    input: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.stroke, borderRadius: 10, padding: 15, fontSize: 18, marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 15, width: '100%' },
    cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: COLORS.salsaBrown },
    confirmBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: COLORS.verdePinton },
    confirmText: { color: '#fff', fontWeight: 'bold' },
    cancelText: { color: COLORS.salsaBrown, fontWeight: 'bold' }
});