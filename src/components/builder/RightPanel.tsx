import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useOrderStore } from '../../store/useOrderStore';

export const RightPanel = () => {
  const navigation = useNavigation<any>();
  const {
    addPlatanada,
    duplicatePlatanada,
    removePlatanada,
    currentOrder,
    currentPlatanadaIndex
  } = useOrderStore();

  const platanadaActual = currentOrder?.items[currentPlatanadaIndex];
  const precio = platanadaActual ? platanadaActual.precioCalculado : 0;

  return (
    <View style={styles.container}>
      <View style={styles.actionsStack}>

        {/* Botón Lupa (Temporadas) */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.cream }]}
          onPress={() => navigation.navigate('SeasonalModal')}
        >
          <Ionicons name="search" size={28} color={COLORS.salsa} />
          <Text style={styles.btnLabel}>Temp.</Text>
        </TouchableOpacity>

        {/* Separador Visual */}
        <View style={styles.divider} />

        {/* Acciones CRUD */}
        <TouchableOpacity style={styles.actionBtn} onPress={addPlatanada}>
          <Ionicons name="add-circle" size={32} color={COLORS.verdePinton} />
          <Text style={styles.btnLabel}>Nueva</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={duplicatePlatanada}>
          <Ionicons name="copy" size={26} color={COLORS.bananaShadow} />
          <Text style={styles.btnLabel}>Duplicar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={removePlatanada}>
          <Ionicons name="trash" size={26} color={COLORS.danger} />
          <Text style={styles.btnLabel}>Borrar</Text>
        </TouchableOpacity>
      </View>

      {/* Footer: Precio y Check */}
      <View style={styles.footer}>
        <Text style={styles.priceLabel}>Total Platanada</Text>
        <Text style={styles.priceValue}>${precio.toLocaleString('es-CO')}</Text>

        <TouchableOpacity
          style={styles.checkBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Ionicons name="checkmark" size={40} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: COLORS.verdePintonTrans,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  actionsStack: {
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 65,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    ...SHADOWS.button,
  },
  btnLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    color: COLORS.salsaBrown,
  },
  divider: {
    height: 2,
    width: '60%',
    backgroundColor: COLORS.stroke,
    opacity: 0.1,
    marginVertical: 5,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.salsaBrown,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.salsa,
    marginBottom: 10,
  },
  checkBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.verdePinton,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.stroke,
    ...SHADOWS.button,
  },
});