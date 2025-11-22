import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useOrderStore } from '../store/useOrderStore';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { currentOrder, initOrder, getOrderTotal } = useOrderStore();

    const [isModalVisible, setModalVisible] = useState(false);
    const [alias, setAlias] = useState('');

    const handleNewOrder = () => {
        // Si ya hay una orden en curso, advertir
        if (currentOrder) {
            Alert.alert(
                "Orden en Curso",
                "Ya tienes un pedido abierto. ¿Deseas continuarlo o descartarlo?",
                [
                    { text: "Descartar", style: 'destructive', onPress: () => { setModalVisible(true); /* TODO: Limpiar store */ } },
                    { text: "Continuar", onPress: () => navigation.navigate('Builder') }
                ]
            );
        } else {
            setModalVisible(true);
        }
    };

    const confirmCreateOrder = () => {
        if (!alias.trim()) return;

        // Iniciar estado global
        initOrder(alias, 'bosque_popular'); // ID sucursal hardcodeado o traído de Auth
        setModalVisible(false);
        setAlias('');

        // Ir al constructor
        navigation.navigate('Builder');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcome}>Hola, Cajero 👋</Text>
                <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
            </View>

            <View style={styles.content}>

                {/* Botón Gigante: NUEVO PEDIDO */}
                <TouchableOpacity style={styles.newOrderBtn} onPress={handleNewOrder}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="restaurant" size={50} color={COLORS.cream} />
                    </View>
                    <Text style={styles.newOrderText}>Nuevo Pedido</Text>
                </TouchableOpacity>

                {/* Card: Pedido Activo (Solo si existe) */}
                {currentOrder && (
                    <View style={styles.activeOrderCard}>
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

            </View>

            {/* Modal para Nombre del Cliente */}
            <Modal transparent visible={isModalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
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
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.salsa,
    },
    date: {
        fontSize: 16,
        color: COLORS.salsaBrown,
    },
    content: {
        flex: 1,
        padding: 20,
        flexDirection: 'row', // Horizontal para iPad
        gap: 30,
        alignItems: 'flex-start',
    },
    newOrderBtn: {
        flex: 1,
        height: 300,
        backgroundColor: COLORS.verdePinton,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.button,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    newOrderText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.cream,
    },

    // Active Order Card
    activeOrderCard: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: COLORS.guavaCoral,
        ...SHADOWS.card,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    activeLabel: {
        color: COLORS.guavaCoral,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 12,
    },
    clientName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.salsa,
        marginBottom: 5,
    },
    itemsCount: {
        fontSize: 16,
        color: COLORS.salsaBrown,
    },
    totalPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.salsa,
        marginVertical: 15,
    },
    resumeBtn: {
        backgroundColor: COLORS.salsa,
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    resumeText: {
        color: '#fff',
        fontWeight: 'bold',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: 400,
        backgroundColor: COLORS.cream,
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.verdePinton,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.salsa,
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.stroke,
        borderRadius: 10,
        padding: 15,
        fontSize: 18,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.salsaBrown,
    },
    confirmBtn: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: COLORS.verdePinton,
    },
    confirmText: { color: '#fff', fontWeight: 'bold' },
    cancelText: { color: COLORS.salsaBrown, fontWeight: 'bold' }
});