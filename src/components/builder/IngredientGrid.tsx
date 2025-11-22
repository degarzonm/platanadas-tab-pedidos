import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useOrderStore } from '../../store/useOrderStore';
import { IngredienteVenta } from '../../types';

// Calculamos el ancho de columna para que se vea bien en iPad
const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 4;

export const IngredientGrid = () => {
  const { menuIngredientes, activeCategory, currentOrder, currentPlatanadaIndex, updateIngredient } = useOrderStore();

  const filteredData = menuIngredientes.filter(i => i.tipo === activeCategory);

  const getQty = (id: string) => {
    if (!currentOrder || !currentOrder.items[currentPlatanadaIndex]) return 0;
    return currentOrder.items[currentPlatanadaIndex].ingredientes[id] || 0;
  };

  const renderItem = ({ item }: { item: IngredienteVenta }) => {
    const qty = getQty(item.id);
    // Aseguramos protocolo https
    const imgUrl = item.link_icon?.startsWith('http') ? item.link_icon : `https://${item.link_icon}`;

    return (
      <View style={styles.card}>
        <Text style={styles.name} numberOfLines={2}>{item.nombre}</Text>
        <Text style={styles.name} numberOfLines={1}>
          $ {item.precio_porcion < 1000 ? item.precio_porcion : item.precio_porcion / 1000 + " K"}
        </Text>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imgUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => updateIngredient(item.id, -1)}
            style={[styles.btn, qty === 0 && styles.btnDisabled]}
            disabled={qty === 0}
          >
            <Text style={styles.btnText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qty}>{qty}</Text>

          <TouchableOpacity
            onPress={() => updateIngredient(item.id, 1)}
            style={styles.btn}
          >
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.creamAlt,
    padding: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'flex-start',
    gap: 15,
    marginBottom: 15,
  },
  card: {
    flex: 1,
    maxWidth: '23%', // Ajuste para 4 columnas
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.verdePinton,
    ...SHADOWS.card,
    minHeight: 200, // Altura mínima para acomodar imagen grande
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.salsaBrown,
    textAlign: 'center',
    height: 35,
    marginBottom: 5,
  },
  imageContainer: {
    width: '100%',
    height: 120, // Altura dinámica visual, la imagen se ajustará con contain
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 'auto', // Empuja los controles al fondo
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.banana,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.stroke,
  },
  btnDisabled: {
    backgroundColor: '#eee',
    opacity: 0.5,
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: COLORS.salsa,
    lineHeight: 20,
  },
  qty: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.salsa,
    minWidth: 24,
    textAlign: 'center',
  },
});