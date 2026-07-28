export interface Empresa {
  id?: string
  logo?: string
  razon_social: string
  rut: string
  giro: string
  direccion: string
  region: string
  ciudad: string
  telefono: string
  email: string
  ejecutivo: string
  condicion_pago: string
  validez_oferta: string
  datos_bancarios?: string
  nombre_sistema?: string
  subtitulo_sistema?: string
  firma?: string
}

export interface Cliente {
  id?: string
  razon_social: string
  alias?: string
  rut: string
  giro: string
  direccion: string
  region: string
  ciudad: string
  comuna?: string
  telefono: string
  email: string
  contacto: string
  created_at?: string
}

export interface DetalleCotizacion {
  id?: string
  cotizacion_id?: string
  cantidad: number
  unidad: string
  producto: string
  descripcion: string
  valor_unitario: number
  subtotal: number
  imagen?: string
}

export type EstadoCotizacion = 'borrador' | 'enviada' | 'aceptada' | 'rechazada'

export interface Cotizacion {
  id?: string
  numero: string
  cliente_id?: string
  cliente?: Cliente
  fecha: string
  compra_agil: string
  identificador?: string
  condicion_pago: string
  validez: string
  observaciones: string
  subtotal: number
  iva: number
  total: number
  estado: EstadoCotizacion
  detalles?: DetalleCotizacion[]
  created_at?: string
}
