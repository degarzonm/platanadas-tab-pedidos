import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOrderStore } from '../store/useOrderStore';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const SeasonalModal = () => {
  const navigation = useNavigation();
  const { menuTemporadas, applySeasonalPlatanada } = useOrderStore();

  const handleSelect = (id: string) => {
    applySeasonalPlatanada(id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Platanadas de Temporada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close-circle" size={36} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={menuTemporadas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleSelect(item.id)}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <Ionicons name="arrow-forward-circle" size={28} color={COLORS.verdePinton} />
                </View>
                <Text style={styles.description}>{item.descripcion}</Text>
                <View style={styles.tagContainer}>
                    <Text style={styles.tag}>Preconfigurada</Text>
                </View>
            </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Fredoka-Bold', // Asegúrate de cargar la fuente o usar system
    color: COLORS.salsa,
    fontWeight: 'bold',
  },
  list: {
    gap: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.verdePinton,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.salsa,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: COLORS.salsaBrown,
    lineHeight: 20,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: COLORS.banana,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.salsa,
  }
});