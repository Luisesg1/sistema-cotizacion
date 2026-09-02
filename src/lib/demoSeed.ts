import { Cliente, Cotizacion, DetalleCotizacion, Empresa } from '../types'

// Datos ficticios para el modo demo (portafolio). No representan datos reales.
const KEYS = {
  empresa: 'cot_empresa',
  clientes: 'cot_clientes',
  cotizaciones: 'cot_cotizaciones',
  detalles: 'cot_detalles',
  counter: 'cot_counter',
}

const empresa: Empresa = {
  id: 'demo-empresa',
  logo: '',
  razon_social: 'Soluciones Tecnológicas del Sur SpA',
  rut: '77.123.456-7',
  giro: 'Comercialización de equipos y servicios tecnológicos',
  direccion: 'Av. Libertad 1234, Oficina 501',
  region: 'Ñuble',
  ciudad: 'Chillán',
  telefono: '+56 9 8765 4321',
  email: 'contacto@solucionesdelsur.cl',
  ejecutivo: 'María González R.',
  condicion_pago: 'Crédito (30 días)',
  validez_oferta: '10 días',
  datos_bancarios: 'Soluciones Tecnológicas del Sur SpA\nRUT: 77.123.456-7\nBanco de Chile\nCuenta Corriente\nN° 001-98765-43\nEmail: pagos@solucionesdelsur.cl',
  nombre_sistema: 'Cotizaciones',
  subtitulo_sistema: 'Demo Portafolio',
  firma: '',
}

const clientes: Cliente[] = [
  {
    id: 'demo-cli-1',
    razon_social: 'I. Municipalidad de Chillán',
    alias: 'Muni Chillán',
    rut: '69.150.100-1',
    giro: 'Administración pública',
    direccion: 'Plaza de Armas 445',
    region: 'Ñuble',
    ciudad: 'Chillán',
    comuna: 'Chillán',
    telefono: '+56 42 220 1000',
    email: 'compras@munichillan.cl',
    contacto: 'Depto. Adquisiciones',
    created_at: '2026-07-10T10:00:00.000Z',
  },
  {
    id: 'demo-cli-2',
    razon_social: 'Constructora Andes Ltda.',
    alias: 'Andes',
    rut: '76.888.222-K',
    giro: 'Construcción de obras civiles',
    direccion: 'Camino Real 780',
    region: 'Ñuble',
    ciudad: 'Bulnes',
    comuna: 'Bulnes',
    telefono: '+56 9 5544 3322',
    email: 'adquisiciones@constructorandes.cl',
    contacto: 'Jorge Muñoz',
    created_at: '2026-07-12T14:30:00.000Z',
  },
  {
    id: 'demo-cli-3',
    razon_social: 'Liceo Bicentenario Ñuble',
    alias: 'Liceo Ñuble',
    rut: '70.900.500-3',
    giro: 'Educación',
    direccion: 'Esmeralda 88',
    region: 'Ñuble',
    ciudad: 'Chillán',
    comuna: 'Chillán',
    telefono: '+56 42 221 4567',
    email: 'direccion@liceonuble.cl',
    contacto: 'Coordinación TI',
    created_at: '2026-07-15T09:15:00.000Z',
  },
]

// Fechas en el mes actual para que el Dashboard siempre muestre las cotizaciones.
// dayOffset resta días pero se mantiene dentro del mes en curso (clamp al día 1).
const today = new Date()
const dateIn = (dayOffset: number) => {
  const day = Math.max(1, today.getDate() - dayOffset)
  return new Date(today.getFullYear(), today.getMonth(), day)
}
const isoDate = (dayOffset: number): string => {
  const d = dateIn(dayOffset)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
const numFor = (dayOffset: number, seq: number): string => {
  const d = dateIn(dayOffset)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}-${seq}`
}

const cotizaciones: Cotizacion[] = [
  {
    id: 'demo-cot-1',
    numero: numFor(0, 1),
    cliente_id: 'demo-cli-1',
    fecha: isoDate(0),
    compra_agil: '3784-83-COT26',
    identificador: 'REF-2026-001',
    condicion_pago: 'Crédito (30 días)',
    validez: '10 días',
    observaciones: 'Despacho en 4 a 5 días hábiles (lun- vie) una vez aceptada la Orden de Compra Tiempo de viaje de 2 días aprox. Somos empresa regional, Valores incluyen flete.',
    subtotal: 1290000,
    iva: 245100,
    total: 1535100,
    estado: 'enviada',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-cot-2',
    numero: numFor(1, 1),
    cliente_id: 'demo-cli-2',
    fecha: isoDate(1),
    compra_agil: '',
    identificador: 'REF-2026-002',
    condicion_pago: 'Contado',
    validez: '15 días',
    observaciones: 'Valores incluyen flete a obra. Garantía de 12 meses en todos los equipos.',
    subtotal: 640000,
    iva: 121600,
    total: 761600,
    estado: 'aceptada',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-cot-3',
    numero: numFor(2, 2),
    cliente_id: 'demo-cli-3',
    fecha: isoDate(2),
    compra_agil: '5521-40-COT26',
    identificador: '',
    condicion_pago: 'Crédito (30 días)',
    validez: '10 días',
    observaciones: 'Instalación y configuración incluida. Capacitación básica al personal.',
    subtotal: 890000,
    iva: 169100,
    total: 1059100,
    estado: 'enviada',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
]

const detalles: DetalleCotizacion[] = [
  // Cot 1
  { id: 'demo-det-1', cotizacion_id: 'demo-cot-1', cantidad: 3, unidad: 'unid.', producto: 'Notebook Lenovo ThinkPad E14', descripcion: 'Procesador: Intel Core i5-1335U\nMemoria RAM: 16 GB\nAlmacenamiento: 512 GB SSD\nPantalla: 14" Full HD\nSistema: Windows 11 Pro', valor_unitario: 380000, subtotal: 1140000 },
  { id: 'demo-det-2', cotizacion_id: 'demo-cot-1', cantidad: 3, unidad: 'unid.', producto: 'Mouse inalámbrico Logitech M170', descripcion: 'Conexión: USB receptor\nAutonomía: 12 meses', valor_unitario: 50000, subtotal: 150000 },
  // Cot 2
  { id: 'demo-det-3', cotizacion_id: 'demo-cot-2', cantidad: 2, unidad: 'unid.', producto: 'Impresora multifuncional Epson L3250', descripcion: 'Función: Impresión, copia y escaneo\nConexión: Wi-Fi\nTecnología: Tinta continua', valor_unitario: 220000, subtotal: 440000 },
  { id: 'demo-det-4', cotizacion_id: 'demo-cot-2', cantidad: 4, unidad: 'unid.', producto: 'Disco duro externo Seagate 2TB', descripcion: 'Capacidad: 2 TB\nInterfaz: USB 3.0', valor_unitario: 50000, subtotal: 200000 },
  // Cot 3
  { id: 'demo-det-5', cotizacion_id: 'demo-cot-3', cantidad: 10, unidad: 'unid.', producto: 'Tablet Samsung Galaxy Tab A9', descripcion: 'Pantalla: 11"\nMemoria: 64 GB\nRAM: 4 GB\nIncluye funda protectora', valor_unitario: 89000, subtotal: 890000 },
]

/** Precarga datos demo en localStorage si aún no existen. */
export function seedDemoData() {
  try {
    if (!localStorage.getItem(KEYS.empresa)) {
      localStorage.setItem(KEYS.empresa, JSON.stringify(empresa))
    }
    if (!localStorage.getItem(KEYS.clientes)) {
      localStorage.setItem(KEYS.clientes, JSON.stringify(clientes))
    }
    if (!localStorage.getItem(KEYS.cotizaciones)) {
      localStorage.setItem(KEYS.cotizaciones, JSON.stringify(cotizaciones))
    }
    if (!localStorage.getItem(KEYS.detalles)) {
      localStorage.setItem(KEYS.detalles, JSON.stringify(detalles))
    }
  } catch { /* localStorage no disponible */ }
}
