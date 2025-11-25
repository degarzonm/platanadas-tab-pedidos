import { BackendPedido, IngredienteVenta, PedidoLocal, PlatanadaLocal } from '../types';

/**
 * Transforma el array de objetos PlatanadaLocal al formato de strings que espera Go.
 * Ejemplo entrada: [{ ingredientes: { "p_pollo": 2, "s_bechamel": 1 } }]
 * Ejemplo salida: ["p_pollo,p_pollo,s_bechamel"]
 */
export const formatItemsForBackend = (items: PlatanadaLocal[]): string[] => {
  return items.map(platanada => {
    const ingredientesFlat: string[] = [];
    
    // Aplanamos el mapa de cantidades: si hay 2 pollos, ponemos el ID 2 veces
    Object.entries(platanada.ingredientes).forEach(([id, qty]) => {
      for (let i = 0; i < qty; i++) {
        ingredientesFlat.push(id);
      }
    });
    
    // Unimos con comas para formar el string de la platanada
    return ingredientesFlat.join(',');
  });
};

/**
 * Convierte un string CSV del backend a un objeto PlatanadaLocal
 * Entrada: "p_carne,p_carne,s_salsa"
 * Salida: { uuid: "...", ingredientes: { p_carne: 2, s_salsa: 1 }, ... }
 */
export const parseBackendProductsToLocal = (
  productsJson: string[], 
  menuIngredientes: IngredienteVenta[]
): PlatanadaLocal[] => {
  return productsJson.map(productStr => {
    const ingredientsList = productStr.split(',');
    const ingredientesMap: { [id: string]: number } = {};
    let precioCalculado = 0;

    ingredientsList.forEach(ingId => {
      // 1. Contar cantidad
      ingredientesMap[ingId] = (ingredientesMap[ingId] || 0) + 1;
      
      // 2. Re-calcular precio (importante para mostrar totales correctos en historial)
      const ingData = menuIngredientes.find(i => i.id === ingId);
      if (ingData) {
        precioCalculado += Number(ingData.precio_porcion);
      }
    });

    return {
      uuid: `${Date.now()}-${Math.random()}`, // Generamos un ID temporal UI
      ingredientes: ingredientesMap,
      precioCalculado: precioCalculado
    };
  });
};

/**
 * Prepara el pedido local para ser enviado en el Payload de Sync
 */
export const mapLocalToSyncPayload = (pedido: PedidoLocal): Partial<BackendPedido> => {
  return {
    id: pedido.id, // Si es undefined, el backend sabrá que es nuevo
    sucursal_id: pedido.sucursal_id,
    comensal: pedido.comensal,
    productos_json: formatItemsForBackend(pedido.items), // Reutilizamos tu función existente
    total: pedido.total.toString(),
    estado: pedido.estado,
    estado_pago: pedido.modo_pago === 'efectivo' ? 'pendiente' : 'pagado', // Lógica de negocio simple
    modo_pago: pedido.modo_pago,
    t_creacion: pedido.t_creacion,
    // t_modificacion y entrega se manejan en backend usualmente, pero puedes enviarlos si los trackeas
  };
};