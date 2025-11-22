import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useOrderStore } from '../../store/useOrderStore';

const CATEGORIES = [
  { id: 'base', label: 'Base', icon: '🍌' },
  { id: 'proteina', label: 'Proteínas', icon: '🥩' },
  { id: 'salsa', label: 'Salsas', icon: '🥣' },
  { id: 'topping', label: 'Toppings', icon: '🧀' },
  { id: 'bebida', label: 'Bebidas', icon: '🥤' },
];

export const CategorySidebar = () => {
  const { activeCategory, setCategory } = useOrderStore();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.button, activeCategory === cat.id && styles.activeButton]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text style={[styles.text, activeCategory === cat.id && styles.activeText]}>
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
    backgroundColor: COLORS.cream,
    borderRightWidth: 1,
    borderColor: COLORS.verdePintonTrans,
  },
  scroll: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 15,
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
  activeButton: {
    backgroundColor: COLORS.verdePinton,
    borderColor: COLORS.verdePinton,
    transform: [{ scale: 1.05 }],
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
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