import { PlatanadaLocal } from '../types';

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