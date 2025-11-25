import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackendPedido, IngredienteVenta, PedidoLocal, PedidoSyncResult, PlatanadaLocal } from '../types';
import { mapLocalToSyncPayload, parseBackendProductsToLocal } from '../utils/formatters';
import { ENDPOINTS } from '../api/endpoints';
import client from '../api/client';

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

  isSyncing: boolean; // Nuevo flag para loading UI
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
  syncHistory: () => Promise<void>;
  // resetear store de la app
  resetStore: () => void;
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
      isSyncing: false,

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

      resetStore: () => set({
        currentOrder: null,
        currentPlatanadaIndex: 0,
        history: [], // Limpiamos historial en memoria
        menuIngredientes: [], // Opcional: si quieres forzar recarga de menú
        menuTemporadas: []
      }),

      clearCurrentOrder: () => set({ currentOrder: null, currentPlatanadaIndex: 0 }),

      selectPlatanadaTab: (index) => set({ currentPlatanadaIndex: index }),
      setCategory: (cat) => set({ activeCategory: cat }),

      addPlatanada: () => set((state) => {
        if (!state.currentOrder) return {};

        // Usamos la misma lógica de ID robusto
        const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const nueva: PlatanadaLocal = {
          uuid: uniqueId,
          ingredientes: {},
          precioCalculado: 0
        };

        return {
          currentOrder: { ...state.currentOrder, items: [...state.currentOrder.items, nueva] },
          currentPlatanadaIndex: state.currentOrder.items.length,
          activeCategory: 'base'
        };
      }),

      duplicatePlatanada: () => set((state) => {
        if (!state.currentOrder) return {};

        // 1. Obtenemos la platanada que queremos clonar
        const actual = state.currentOrder.items[state.currentPlatanadaIndex];

        // 2. GENERACIÓN DE ID ROBUSTO
        // Usar solo Date.now() es peligroso si el procesador es rápido (puede generar duplicados).
        // Agregamos Math.random() para garantizar unicidad sin librerías externas.
        const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 3. DEEP COPY (El Bug Fix Principal 🐛)
        // Al usar el spread operator {...actual.ingredientes} dentro de un nuevo objeto {},
        // estamos creando un NUEVO espacio en memoria y copiando los valores uno a uno.
        // Esto desvincula totalmente la copia del original.
        const copia: PlatanadaLocal = {
          ...actual,
          uuid: uniqueId,
          ingredientes: { ...actual.ingredientes }, // <--- AQUÍ ESTABA EL PROBLEMA
          precioCalculado: actual.precioCalculado
        };

        return {
          currentOrder: {
            ...state.currentOrder,
            items: [...state.currentOrder.items, copia]
          },
          // 4. Movemos el foco (tab) a la nueva platanada creada (la última en el array)
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

      syncHistory: async () => {
        // Capturamos el estado AL INICIO
        const stateAtStart = get();
        const historyToSync = stateAtStart.history; // Lo que vamos a intentar subir

        set({ isSyncing: true });

        try {
          const pedidosPayload = historyToSync.map((p: PedidoLocal) => mapLocalToSyncPayload(p));

          const response = await client.post(ENDPOINTS.SYNC_HISTORIAL, {
            pedidos: pedidosPayload
          });

          let results: PedidoSyncResult[] = [];
          if (response.data && Array.isArray(response.data.pedidos)) {
            results = response.data.pedidos;
          } else {
            console.warn("⚠️ Estructura inesperada del Backend:", response.data);
            set({ isSyncing: false });
            return;
          }

          // --- LÓGICA DE FUSIÓN INTELIGENTE ---

          // 1. Procesamos lo que el servidor nos devolvió (Los "synced")
          const processedFromServer: PedidoLocal[] = [];

          // Mapa auxiliar de lo que enviamos para preservar datos locales si el server dice "ok"
          const sentMap = new Map();
          historyToSync.forEach(p => {
            if (p.id) sentMap.set(p.id, p);
            else sentMap.set(p.t_creacion, p);
          });

          results.forEach(res => {
            let pedidoFinal: PedidoLocal | null = null;

            // Helper (repite tu función convertToLocal aquí o sácala afuera si prefieres)
            const convertToLocal = (bp: BackendPedido): PedidoLocal => ({
              id: bp.id,
              sucursal_id: bp.sucursal_id,
              comensal: bp.comensal || "Sin Nombre",
              items: parseBackendProductsToLocal(bp.productos_json, get().menuIngredientes), // Usar get().menuIngredientes fresco
              total: Number(bp.total),
              estado: bp.estado as any,
              modo_pago: bp.modo_pago as any,
              t_creacion: bp.t_creacion,
              t_modificacion: bp.t_modificacion,
              t_entrega: bp.t_entrega
            });

            switch (res.status) {
              case 'ok':
                const existingOk = sentMap.get(res.id);
                if (existingOk) pedidoFinal = existingOk;
                break;
              case 'created':
              case 'updated':
              case 'no-local':
                if (res.data) pedidoFinal = convertToLocal(res.data);
                break;
            }

            if (pedidoFinal) {
              processedFromServer.push(pedidoFinal);
            }
          });

          // 2. CRÍTICO: Recuperar el estado MÁS RECIENTE
          // Mientras esperábamos 'await client.post', el usuario pudo crear un pedido nuevo.
          const currentFreshHistory = get().history;

          // 3. Identificar pedidos "nuevos" que no estaban en el paquete que enviamos
          // Usamos t_creacion como huella digital única si no hay ID
          const sentTimestamps = new Set(historyToSync.map(p => p.t_creacion));

          const newLocalOrders = currentFreshHistory.filter(p =>
            !sentTimestamps.has(p.t_creacion) && !p.id // Pedidos creados JUSTO AHORA (sin ID y fecha no enviada)
          );

          // 4. Mezclar: Lo que procesó el server + Lo nuevo local
          const finalHistory = [...processedFromServer, ...newLocalOrders];

          // Ordenar
          finalHistory.sort((a, b) =>
            new Date(b.t_creacion).getTime() - new Date(a.t_creacion).getTime()
          );

          set({ history: finalHistory });

        } catch (error) {
          console.error("Sync failed:", error);
        } finally {
          set({ isSyncing: false });
        }
      },
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