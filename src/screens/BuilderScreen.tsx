import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { useOrderStore } from '../store/useOrderStore';
import { CategorySidebar } from '../components/builder/CategorySidebar';
import { IngredientGrid } from '../components/builder/IngredientGrid';
import { RightPanel } from '../components/builder/RightPanel';
import { COLORS } from '../constants/theme';

export const BuilderScreen = () => {
  const { currentOrder, currentPlatanadaIndex, selectPlatanadaTab } = useOrderStore();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  if (!currentOrder) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientLabel}>PEDIDO DE:</Text>
          <Text style={styles.clientName}>{currentOrder.comensal}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {currentOrder.items.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tab, currentPlatanadaIndex === index && styles.activeTab]}
              onPress={() => selectPlatanadaTab(index)}
            >
              <Text style={[styles.tabText, currentPlatanadaIndex === index && styles.activeTabText]}>
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Layout Responsivo */}
      <View style={[styles.body, !isTablet && styles.bodyMobile]}>
        {/* En Tablet: Sidebar izquierda. En Móvil: Barra superior horizontal (necesitaremos ajustar el componente Sidebar internamente o aquí envolverlo) */}
        <View style={isTablet ? styles.leftPanel : styles.topPanelMobile}>
          <CategorySidebar isMobile={!isTablet} />
        </View>

        <View style={styles.centerPanel}>
          <IngredientGrid />
        </View>

        <View style={isTablet ? styles.rightPanel : styles.bottomPanelMobile}>
          <RightPanel isMobile={!isTablet} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.stroke, height: 60 },
  clientInfo: { marginRight: 20 },
  clientLabel: { fontSize: 10, color: COLORS.salsaBrown, textTransform: 'uppercase' },
  clientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.salsa },
  tabsScroll: { flexGrow: 0 },
  tab: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: COLORS.stroke },
  activeTab: { backgroundColor: COLORS.guavaCoral, borderColor: COLORS.salsa },
  tabText: { fontSize: 14, fontWeight: 'bold', color: COLORS.salsa },
  activeTabText: { color: '#fff' },

  // Layout
  body: { flex: 1, flexDirection: 'row' },
  bodyMobile: { flexDirection: 'column' },

  // Areas
  leftPanel: { width: 90, zIndex: 1 },
  topPanelMobile: { height: 80, width: '100%', zIndex: 1 }, // Barra horizontal categorías

  centerPanel: { flex: 1 },

  rightPanel: { width: 100, zIndex: 1 },
  bottomPanelMobile: { height: 80, width: '100%', zIndex: 1 }, // Barra horizontal acciones
});