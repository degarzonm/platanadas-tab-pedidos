import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useOrderStore } from '../../store/useOrderStore';
import { IngredienteVenta } from '../../types';

type IngredientCardProps = {
  item: IngredienteVenta;
  qty: number;
  cardWidthPercent: string;
  imgUrl: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

const IngredientCard: React.FC<IngredientCardProps> = ({
  item,
  qty,
  cardWidthPercent,
  imgUrl,
  onIncrement,
  onDecrement,
}) => {
  const backgroundAnim = React.useRef(new Animated.Value(qty > 0 ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(backgroundAnim, {
      toValue: qty > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [qty, backgroundAnim]);

  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', COLORS.verdePinton],
  });

  return (
    <Animated.View style={[styles.card, { maxWidth: cardWidthPercent, backgroundColor }]}>
      <Text style={styles.name} numberOfLines={2}>{item.nombre}</Text>
      <Text style={styles.price} numberOfLines={1}>
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
          onPress={onDecrement}
          style={[styles.btn, qty === 0 && styles.btnDisabled]}
          disabled={qty === 0}
        >
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.qty}>{qty}</Text>

        <TouchableOpacity
          onPress={onIncrement}
          style={styles.btn}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const IngredientGrid = () => {
  const { width } = useWindowDimensions();
  const { menuIngredientes, activeCategory, currentOrder, currentPlatanadaIndex, updateIngredient } = useOrderStore();

  // L��gica de Columnas Dinǭmicas
  const isMobile = width < 768;
  const NUM_COLUMNS = isMobile ? 2 : 4;
  
  // Ajuste fino del ancho de tarjeta
  const cardWidthPercent = isMobile ? '47%' : '23%'; 

  const filteredData = menuIngredientes.filter(i => i.tipo === activeCategory);

  const getQty = (id: string) => {
    if (!currentOrder || !currentOrder.items[currentPlatanadaIndex]) return 0;
    return currentOrder.items[currentPlatanadaIndex].ingredientes[id] || 0;
  };

  const renderItem = ({ item }: { item: IngredienteVenta }) => {
    const qty = getQty(item.id);
    const imgUrl = item.link_icon?.startsWith('http') ? item.link_icon : `https://${item.link_icon}`;

    return (
      <IngredientCard
        item={item}
        qty={qty}
        cardWidthPercent={cardWidthPercent}
        imgUrl={imgUrl}
        onDecrement={() => updateIngredient(item.id, -1)}
        onIncrement={() => updateIngredient(item.id, 1)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        key={NUM_COLUMNS}
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
    padding: 10, // Padding reducido para m��viles
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'flex-start', // Mejor flex-start con gap para control total
    gap: 10, // Gap nativo de Flexbox
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.verdePinton,
    ...SHADOWS.card,
    minHeight: 180, 
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.salsaBrown,
    textAlign: 'center',
    height: 30,
    marginBottom: 2,
  },
  price: {
    fontSize: 12,
    color: COLORS.salsa,
    marginBottom: 5,
  },
  imageContainer: {
    width: '100%',
    height: 80, 
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
    gap: 8,
    marginTop: 'auto',
  },
  btn: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: 16,
    color: COLORS.salsa,
    lineHeight: 18,
  },
  qty: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.salsa,
    minWidth: 20,
    textAlign: 'center',
  },
});
