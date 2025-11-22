import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useOrderStore } from '../../store/useOrderStore';

interface Props {
  isMobile: boolean;
}

export const CategorySidebar = ({ isMobile }: Props) => {
  const { activeCategory, setCategory } = useOrderStore();

  const CATEGORIES = [
    { id: 'base', label: 'Base', icon: '🍌' },
    { id: 'proteina', label: 'Proteínas', icon: '🥩' },
    { id: 'salsa', label: 'Salsas', icon: '🥣' },
    { id: 'topping', label: 'Toppings', icon: '🧀' },
    { id: 'bebida', label: 'Bebidas', icon: '🥤' },
  ];

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <ScrollView 
        contentContainerStyle={[styles.scroll, isMobile && styles.scrollMobile]}
        horizontal={isMobile} 
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.button, 
              isMobile && styles.buttonMobile,
              activeCategory === cat.id && styles.activeButton
            ]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={[styles.icon, isMobile && styles.iconMobile]}>{cat.icon}</Text>
            <Text 
              style={[
                styles.text, 
                activeCategory === cat.id && styles.activeText,
                isMobile && { fontSize: 9 }
              ]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 90,
    height: '100%',
    backgroundColor: COLORS.cream,
    borderRightWidth: 1,
    borderColor: COLORS.verdePintonTrans,
  },
  containerMobile: {
    width: '100%',
    height: 85,
    borderRightWidth: 0,
    borderBottomWidth: 1,
  },
  scroll: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 15,
  },
  scrollMobile: {
    paddingVertical: 0,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.stroke,
  },
  buttonMobile: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  activeButton: {
    backgroundColor: COLORS.verdePinton,
    borderColor: COLORS.verdePinton,
    transform: [{ scale: 1.05 }],
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  iconMobile: {
    fontSize: 20,
    marginBottom: 0,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.salsa,
  },
  activeText: {
    color: '#fff',
  },
});