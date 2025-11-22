// Espejo de shared.Money (asumimos que llega como number o string decimal)
export type Money = number; 

export type TipoIngrediente = 'base' | 'proteina' | 'salsa' | 'topping' | 'bebida';

export interface IngredienteVenta {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  precio_porcion: Money;
  medida_porcion: number;
  link_icon?: string;
}

// Estructura interna para la App (Frontend)
export interface PlatanadaLocal {
  uuid: string; // Identificador temporal para la UI
  ingredientes: { [idIngrediente: string]: number }; // ID -> Cantidad
  precioCalculado: Money;
}

export interface PlatanadaTemporada {
  id: string;
  nombre: string;
  descripcion: string;
  ingredientes_json: string[]; // ["p_carne_res","p_chorizo_asado","s_frijol",..]
  conteo: number;
}

export interface PedidoLocal {
  id?: string; // Puede ser null si aun no se ha enviado
  sucursal_id: string;
  comensal: string; // Alias
  items: PlatanadaLocal[];
  total: Money;
  estado: 'creado' | 'en_preparacion' | 'finalizado' | 'cancelado';
  modo_pago: 'efectivo' | 'tarjeta' | 'billeteras' | 'pendiente';
  t_creacion: string;
}

export interface DatosDiaResponse {
  ingredientes: IngredienteVenta[];
  platanadas_temporadas: PlatanadaTemporada[]; // ahora tipado correctamente
  historial_pedidos: PedidoLocal[]; // O la estructura que retorne el backend
}