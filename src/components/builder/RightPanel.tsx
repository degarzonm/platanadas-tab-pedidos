import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useOrderStore } from '../../store/useOrderStore';

interface Props {
  isMobile: boolean;
}

export const RightPanel = ({ isMobile }: Props) => {
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
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      
      {/* Grupo de Acciones */}
      <View style={[styles.actionsStack, isMobile && styles.actionsStackMobile]}>
        
        <TouchableOpacity
          style={[styles.actionBtn, isMobile && styles.actionBtnMobile, { backgroundColor: COLORS.cream }]}
          onPress={() => navigation.navigate('SeasonalModal')}
        >
          <Ionicons name="search" size={isMobile ? 22 : 28} color={COLORS.salsa} />
          {!isMobile && <Text style={styles.btnLabel}>Temp.</Text>}
        </TouchableOpacity>

        {!isMobile && <View style={styles.divider} />}

        <TouchableOpacity style={[styles.actionBtn, isMobile && styles.actionBtnMobile]} onPress={addPlatanada}>
          <Ionicons name="add-circle" size={isMobile ? 24 : 32} color={COLORS.verdePinton} />
          {!isMobile && <Text style={styles.btnLabel}>Nueva</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, isMobile && styles.actionBtnMobile]} onPress={duplicatePlatanada}>
          <Ionicons name="copy" size={isMobile ? 20 : 26} color={COLORS.bananaShadow} />
          {!isMobile && <Text style={styles.btnLabel}>Duplicar</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, isMobile && styles.actionBtnMobile]} onPress={removePlatanada}>
          <Ionicons name="trash" size={isMobile ? 20 : 26} color={COLORS.danger} />
          {!isMobile && <Text style={styles.btnLabel}>Borrar</Text>}
        </TouchableOpacity>
      </View>

      {/* Footer: Precio y Check */}
      <View style={[styles.footer, isMobile && styles.footerMobile]}>
        <View style={{ alignItems: isMobile ? 'flex-start' : 'center' }}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={[styles.priceValue, isMobile && {marginBottom:0}]}>${precio.toLocaleString('es-CO')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkBtn, isMobile && styles.checkBtnMobile]}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Ionicons name="checkmark" size={isMobile ? 28 : 40} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: '100%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: COLORS.verdePintonTrans,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  containerMobile: {
    width: '100%',
    height: 80, // Barra inferior fija
    borderLeftWidth: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 5,
    alignItems: 'center',
  },
  actionsStack: {
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
  },
  actionsStackMobile: {
    flexDirection: 'row',
    marginTop: 0,
    gap: 10,
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
  actionBtnMobile: {
    width: 45,
    height: 45,
    borderRadius: 8,
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
  footerMobile: {
    flexDirection: 'row',
    marginBottom: 0,
    alignItems: 'center',
    gap: 15,
    marginLeft: 'auto', // Empuja a la derecha
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
  checkBtnMobile: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});