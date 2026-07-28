import { Cliente, Cotizacion, DetalleCotizacion, Empresa } from '../types'
import { supabase, isSupabaseConfigured } from './supabase'

// LocalStorage fallback keys
const KEYS = {
  empresa: 'cot_empresa',
  clientes: 'cot_clientes',
  cotizaciones: 'cot_cotizaciones',
  detalles: 'cot_detalles',
  counter: 'cot_counter',
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

// ---- Empresa ----

export async function getEmpresa(): Promise<Empresa | null> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('empresa').select('*').limit(1).single()
    return data
  }
  const raw = localStorage.getItem(KEYS.empresa)
  return raw ? JSON.parse(raw) : null
}

export async function saveEmpresa(empresa: Empresa): Promise<Empresa> {
  if (isSupabaseConfigured()) {
    if (empresa.id) {
      const { data } = await supabase.from('empresa').update(empresa).eq('id', empresa.id).select().single()
      return data
    }
    const { data } = await supabase.from('empresa').insert(empresa).select().single()
    return data
  }
  const saved = { ...empresa, id: empresa.id || uid() }
  localStorage.setItem(KEYS.empresa, JSON.stringify(saved))
  return saved
}

// ---- Clientes ----

export async function getClientes(): Promise<Cliente[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('clientes').select('*').order('razon_social')
    return data || []
  }
  const raw = localStorage.getItem(KEYS.clientes)
  const list: Cliente[] = raw ? JSON.parse(raw) : []
  return list.sort((a, b) => a.razon_social.localeCompare(b.razon_social))
}

export async function saveCliente(cliente: Cliente): Promise<Cliente> {
  if (isSupabaseConfigured()) {
    if (cliente.id) {
      const { data } = await supabase.from('clientes').update(cliente).eq('id', cliente.id).select().single()
      return data
    }
    const { data } = await supabase.from('clientes').insert(cliente).select().single()
    return data
  }
  const raw = localStorage.getItem(KEYS.clientes)
  const list: Cliente[] = raw ? JSON.parse(raw) : []
  if (cliente.id) {
    const idx = list.findIndex(c => c.id === cliente.id)
    if (idx >= 0) list[idx] = cliente
    else list.push(cliente)
  } else {
    const saved = { ...cliente, id: uid() }
    list.push(saved)
    localStorage.setItem(KEYS.clientes, JSON.stringify(list))
    return saved
  }
  localStorage.setItem(KEYS.clientes, JSON.stringify(list))
  return cliente
}

export async function deleteCliente(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('cotizaciones').update({ cliente_id: null }).eq('cliente_id', id)
    await supabase.from('clientes').delete().eq('id', id)
    return
  }
  const raw = localStorage.getItem(KEYS.clientes)
  const list: Cliente[] = raw ? JSON.parse(raw) : []
  localStorage.setItem(KEYS.clientes, JSON.stringify(list.filter(c => c.id !== id)))
}

// ---- Numeración ----

export async function generateNumero(): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const prefix = `${yy}${mm}${dd}`

  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('cotizaciones')
      .select('numero')
      .like('numero', `${prefix}-%`)
      .order('numero', { ascending: false })
      .limit(1)
    if (data && data.length > 0) {
      const last = data[0].numero as string
      const n = parseInt(last.split('-')[1] || '0') + 1
      return `${prefix}-${n}`
    }
    return `${prefix}-1`
  }

  const raw = localStorage.getItem(KEYS.cotizaciones)
  const list: Cotizacion[] = raw ? JSON.parse(raw) : []
  const same = list.filter(c => c.numero.startsWith(prefix + '-'))
  if (same.length === 0) return `${prefix}-1`
  const max = Math.max(...same.map(c => parseInt(c.numero.split('-')[1] || '0')))
  return `${prefix}-${max + 1}`
}

// ---- Cotizaciones ----

export async function getCotizaciones(): Promise<Cotizacion[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('cotizaciones')
      .select('*, cliente:clientes(*)')
      .order('created_at', { ascending: false })
    return data || []
  }
  const raw = localStorage.getItem(KEYS.cotizaciones)
  const list: Cotizacion[] = raw ? JSON.parse(raw) : []
  const clientesRaw = localStorage.getItem(KEYS.clientes)
  const clientes: Cliente[] = clientesRaw ? JSON.parse(clientesRaw) : []
  return list
    .map(c => ({ ...c, cliente: clientes.find(cl => cl.id === c.cliente_id) }))
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
}

export async function getCotizacion(id: string): Promise<Cotizacion | null> {
  if (isSupabaseConfigured()) {
    const { data: cot } = await supabase
      .from('cotizaciones')
      .select('*, cliente:clientes(*)')
      .eq('id', id)
      .single()
    const { data: detalles } = await supabase
      .from('detalle_cotizacion')
      .select('*')
      .eq('cotizacion_id', id)
      .order('id')
    return cot ? { ...cot, detalles: detalles || [] } : null
  }
  const raw = localStorage.getItem(KEYS.cotizaciones)
  const list: Cotizacion[] = raw ? JSON.parse(raw) : []
  const cot = list.find(c => c.id === id)
  if (!cot) return null
  const detRaw = localStorage.getItem(KEYS.detalles)
  const allDet: DetalleCotizacion[] = detRaw ? JSON.parse(detRaw) : []
  const clientesRaw = localStorage.getItem(KEYS.clientes)
  const clientes: Cliente[] = clientesRaw ? JSON.parse(clientesRaw) : []
  return {
    ...cot,
    cliente: clientes.find(cl => cl.id === cot.cliente_id),
    detalles: allDet.filter(d => d.cotizacion_id === id),
  }
}

export async function saveCotizacion(
  cotizacion: Cotizacion,
  detalles: DetalleCotizacion[]
): Promise<Cotizacion> {
  if (isSupabaseConfigured()) {
    let savedCot: Cotizacion
    if (cotizacion.id) {
      const { data } = await supabase
        .from('cotizaciones')
        .update({ ...cotizacion, detalles: undefined, cliente: undefined })
        .eq('id', cotizacion.id)
        .select()
        .single()
      savedCot = data
      await supabase.from('detalle_cotizacion').delete().eq('cotizacion_id', cotizacion.id)
    } else {
      const { created_at: _, detalles: _d, cliente: _c, ...rest } = cotizacion
      const { data } = await supabase.from('cotizaciones').insert(rest).select().single()
      savedCot = data
    }
    if (detalles.length > 0) {
      await supabase.from('detalle_cotizacion').insert(
        detalles.map(({ id: _id, ...d }) => ({ ...d, cotizacion_id: savedCot.id }))
      )
    }
    return savedCot
  }

  // LocalStorage
  const raw = localStorage.getItem(KEYS.cotizaciones)
  const list: Cotizacion[] = raw ? JSON.parse(raw) : []
  const detRaw = localStorage.getItem(KEYS.detalles)
  const allDet: DetalleCotizacion[] = detRaw ? JSON.parse(detRaw) : []

  const cotId = cotizacion.id || uid()
  const saved: Cotizacion = { ...cotizacion, id: cotId, created_at: cotizacion.created_at || new Date().toISOString() }

  if (cotizacion.id) {
    const idx = list.findIndex(c => c.id === cotizacion.id)
    if (idx >= 0) list[idx] = saved
    else list.push(saved)
    const filtered = allDet.filter(d => d.cotizacion_id !== cotId)
    const newDets = detalles.map(d => ({ ...d, id: uid(), cotizacion_id: cotId }))
    localStorage.setItem(KEYS.detalles, JSON.stringify([...filtered, ...newDets]))
  } else {
    list.push(saved)
    const newDets = detalles.map(d => ({ ...d, id: uid(), cotizacion_id: cotId }))
    localStorage.setItem(KEYS.detalles, JSON.stringify([...allDet, ...newDets]))
  }
  localStorage.setItem(KEYS.cotizaciones, JSON.stringify(list))
  return saved
}

export async function deleteCotizacion(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('detalle_cotizacion').delete().eq('cotizacion_id', id)
    await supabase.from('cotizaciones').delete().eq('id', id)
    return
  }
  const raw = localStorage.getItem(KEYS.cotizaciones)
  const list: Cotizacion[] = raw ? JSON.parse(raw) : []
  localStorage.setItem(KEYS.cotizaciones, JSON.stringify(list.filter(c => c.id !== id)))
  const detRaw = localStorage.getItem(KEYS.detalles)
  const allDet: DetalleCotizacion[] = detRaw ? JSON.parse(detRaw) : []
  localStorage.setItem(KEYS.detalles, JSON.stringify(allDet.filter(d => d.cotizacion_id !== id)))
}
