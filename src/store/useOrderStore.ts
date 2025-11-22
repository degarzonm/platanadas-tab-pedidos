import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IngredienteVenta, PedidoLocal, PlatanadaLocal } from '../types';

interface PlatanadaTemporada {
  id: string;
  nombre: string;
  descripcion: string;
  ingredientes_json: string[];
}

interface OrderState {
  // Data Maestra
  menuIngredientes: IngredienteVenta[];
  menuTemporadas: PlatanadaTemporada[];
  setDatosDia: (ingredientes: IngredienteVenta[], temporadas: PlatanadaTemporada[]) => void;

  // Estado del Constructor
  currentOrder: PedidoLocal | null;
  currentPlatanadaIndex: number;
  activeCategory: string;

  // Acciones
  initOrder: (alias: string, sucursalId: string) => void;
  selectPlatanadaTab: (index: number) => void;
  setCategory: (cat: string) => void;
  clearCurrentOrder: () => void;

  addPlatanada: () => void;
  duplicatePlatanada: () => void;
  removePlatanada: () => void;

  updateIngredient: (ingredienteId: string, delta: number) => void;
  applySeasonalPlatanada: (seasonalId: string) => void;

  calculatePlatanadaPrice: (platanada: PlatanadaLocal) => number;
  getOrderTotal: () => number;

  // Historial
  history: PedidoLocal[];
  addToHistory: (pedido: PedidoLocal) => void;

  // Acciones de Historial
  syncPedido: (localUuid: string, remoteId: string) => void;
  finalizeOrderInHistory: (pedidoIndex: number) => void;
  cancelOrderInHistory: (pedidoIndex: number) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      menuIngredientes: [],
      menuTemporadas: [],
      currentOrder: null,
      currentPlatanadaIndex: 0,
      activeCategory: 'base',
      history: [],

      setDatosDia: (ingredientes, temporadas) => set({
        menuIngredientes: ingredientes,
        menuTemporadas: temporadas
      }),

      initOrder: (alias, sucursalId) => set({
        currentOrder: {
          sucursal_id: sucursalId,
          comensal: alias,
          items: [{ uuid: Date.now().toString(), ingredientes: {}, precioCalculado: 0 }],
          total: 0,
          estado: 'creado',
          modo_pago: 'pendiente',
          t_creacion: new Date().toISOString(),
        },
        currentPlatanadaIndex: 0,
        activeCategory: 'base'
      }),

      clearCurrentOrder: () => set({ currentOrder: null, currentPlatanadaIndex: 0 }),

      selectPlatanadaTab: (index) => set({ currentPlatanadaIndex: index }),
      setCategory: (cat) => set({ activeCategory: cat }),

      addPlatanada: () => set((state) => {
        if (!state.currentOrder) return {};
        const nueva = { uuid: Date.now().toString(), ingredientes: {}, precioCalculado: 0 };
        return {
          currentOrder: { ...state.currentOrder, items: [...state.currentOrder.items, nueva] },
          currentPlatanadaIndex: state.currentOrder.items.length,
          activeCategory: 'base'
        };
      }),

      duplicatePlatanada: () => set((state) => {
        if (!state.currentOrder) return {};
        const actual = state.currentOrder.items[state.currentPlatanadaIndex];
        const copia = { ...actual, uuid: Date.now().toString() };
        return {
          currentOrder: { ...state.currentOrder, items: [...state.currentOrder.items, copia] },
          currentPlatanadaIndex: state.currentOrder.items.length
        };
      }),

      removePlatanada: () => set((state) => {
        if (!state.currentOrder) return {};
        const items = [...state.currentOrder.items];
        if (items.length <= 1) {
          items[0] = { uuid: Date.now().toString(), ingredientes: {}, precioCalculado: 0 };
          return { currentOrder: { ...state.currentOrder, items }, currentPlatanadaIndex: 0 };
        }
        items.splice(state.currentPlatanadaIndex, 1);
        const newIndex = Math.max(0, state.currentPlatanadaIndex - 1);
        return {
          currentOrder: { ...state.currentOrder, items },
          currentPlatanadaIndex: newIndex
        };
      }),

      updateIngredient: (ingId, delta) => set((state) => {
        if (!state.currentOrder) return {};
        const items = [...state.currentOrder.items];
        const idx = state.currentPlatanadaIndex;

        const currentQty = items[idx].ingredientes[ingId] || 0;
        const newQty = Math.max(0, currentQty + delta);

        items[idx].ingredientes[ingId] = newQty;
        if (newQty === 0) delete items[idx].ingredientes[ingId];

        items[idx].precioCalculado = get().calculatePlatanadaPrice(items[idx]);

        return { currentOrder: { ...state.currentOrder, items } };
      }),

      applySeasonalPlatanada: (seasonalId) => {
        const { menuTemporadas, currentOrder, currentPlatanadaIndex, calculatePlatanadaPrice } = get();
        const seasonal = menuTemporadas.find(s => s.id === seasonalId);

        if (!seasonal || !currentOrder) return;

        const ingredientesMap: { [key: string]: number } = {};
        seasonal.ingredientes_json.forEach(id => {
          ingredientesMap[id] = (ingredientesMap[id] || 0) + 1;
        });

        const items = [...currentOrder.items];
        items[currentPlatanadaIndex] = {
          uuid: Date.now().toString(),
          ingredientes: ingredientesMap,
          precioCalculado: 0
        };

        items[currentPlatanadaIndex].precioCalculado = calculatePlatanadaPrice(items[currentPlatanadaIndex]);

        set({ currentOrder: { ...currentOrder, items } });
      },

      calculatePlatanadaPrice: (platanada) => {
        const { menuIngredientes } = get();
        let total = 0;
        for (const [id, qty] of Object.entries(platanada.ingredientes)) {
          const ing = menuIngredientes.find(i => i.id === id);
          if (ing) {
            total += (parseFloat(ing.precio_porcion.toString()) * qty);
          }
        }
        return total;
      },

      getOrderTotal: () => {
        const state = get();
        if (!state.currentOrder) return 0;
        return state.currentOrder.items.reduce((sum, item) => sum + item.precioCalculado, 0);
      },

      // IMPLEMANTACIÓN DE ADD TO HISTORY
      addToHistory: (pedido) => set((state) => ({
        history: [pedido, ...state.history]
      })),

      // ACCIONES DE HISTORIAL Y SYNC
      syncPedido: (localUuid: string, remoteId: string) => set((state) => {
        // Actualiza el pedido local con el ID real del servidor tras sincronizar
        const newHistory = state.history.map(p =>
          p.items[0]?.uuid === localUuid || p.t_creacion === localUuid // Usamos una referencia única
            ? { ...p, id: remoteId }
            : p
        );
        return { history: newHistory };
      }),

      finalizeOrderInHistory: (pedidoIndex: number) => set((state) => {
        const newHistory = [...state.history];
        if (newHistory[pedidoIndex]) {
          newHistory[pedidoIndex].estado = 'finalizado';
        }
        return { history: newHistory };
      }),

      cancelOrderInHistory: (pedidoIndex: number) => set((state) => {
        const newHistory = [...state.history];
        if (newHistory[pedidoIndex]) {
          newHistory[pedidoIndex].estado = 'cancelado';
        }
        return { history: newHistory };
      }),


    }),
    {
      name: 'platanadas-pos-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        menuIngredientes: state.menuIngredientes,
        menuTemporadas: state.menuTemporadas,
        currentOrder: state.currentOrder,
        history: state.history // Persistimos el historial también
      }),
    }
  )
);