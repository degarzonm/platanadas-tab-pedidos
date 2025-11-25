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
  id?: string; // Puede ser null si aun no se ha enviado desde local
  sucursal_id: string;
  comensal: string; // Alias
  items: PlatanadaLocal[];
  total: Money;
  estado: 'creado' | 'en_preparacion' | 'finalizado' | 'cancelado';
  modo_pago: 'efectivo' | 'tarjeta' | 'billeteras' | 'pendiente';
  t_creacion: string;
  t_modificacion?: string;
  t_entrega?: string;
}

export interface DatosDiaResponse {
  ingredientes: IngredienteVenta[];
  platanadas_temporadas: PlatanadaTemporada[]; // ahora tipado correctamente
  historial_pedidos: PedidoLocal[]; // O la estructura que retorne el backend
}

export type SyncStatus = 'ok' | 'updated' | 'created' | 'no-local';

export interface BackendPedido {
  id: string;
  sucursal_id: string;
  comensal: string;
  productos_json: string[]; // ["ing1,ing2", "ing1,ing3"]
  total: number | string; // El backend manda string "12400.00" o number
  descuento: number | string;
  estado: string;
  estado_pago: string;
  modo_pago: string;
  t_creacion: string;
  t_modificacion?: string;
  t_entrega?: string;
}

export interface PedidoSyncResult {
  id: string;
  status: SyncStatus;
  data?: BackendPedido; // Viene si es created, updated o no-local
}

export interface SyncPayload {
  pedidos: Partial<BackendPedido>[]; // Lo que enviamos
}