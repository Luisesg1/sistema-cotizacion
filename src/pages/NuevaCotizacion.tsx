import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Save, FileDown, ChevronDown, ArrowLeft, Calendar, User, Phone, Mail } from 'lucide-react'
import ProductImageCell from '../components/ProductImageCell'
import {
  getEmpresa, getClientes, saveCotizacion, getCotizacion, generateNumero, saveCliente,
} from '../lib/storage'
import { generatePDFNative } from '../lib/pdf'
import { Empresa, Cliente, Cotizacion, DetalleCotizacion } from '../types'
import { formatCLP, todayISO, validateRUT, formatRUT } from '../lib/utils'
import RutInput from '../components/RutInput'
import ConfirmModal from '../components/ConfirmModal'

const emptyDetalle = (): DetalleCotizacion => ({
  cantidad: 1, unidad: 'unid.', producto: '', descripcion: '',
  valor_unitario: 0, subtotal: 0, imagen: undefined,
})

const emptyCliente: Cliente = {
  razon_social: '', alias: '', rut: '', giro: '', direccion: '', comuna: '',
  region: '', ciudad: '', telefono: '', email: '', contacto: '',
}

export default function NuevaCotizacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id && id !== 'nueva')

  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null)
  const [numero, setNumero] = useState('')
  const [fecha, setFecha] = useState(todayISO())
  const [compraAgil, setCompraAgil] = useState('')
  const [identificador, setIdentificador] = useState('')
  const [condicionPago, setCondicionPago] = useState('')
  const [validez, setValidez] = useState('')
  const OBS_DEFAULT = 'Despacho en 4 a 5 días hábiles (lun- vie) una vez aceptada la Orden de Compra Tiempo de viaje de 2 días aprox. Somos empresa regional, Valores incluyen flete.'
  const [observaciones, setObservaciones] = useState(OBS_DEFAULT)
  const [estado, setEstado] = useState<Cotizacion['estado']>('enviada')
  const [detalles, setDetalles] = useState<DetalleCotizacion[]>([emptyDetalle()])
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)

  // Cliente dropdown
  const [showDD, setShowDD] = useState(false)
  const [clienteSearch, setClienteSearch] = useState('')
  const ddRef = useRef<HTMLDivElement>(null)

  // Quick-create client modal
  const [showNewCliente, setShowNewCliente] = useState(false)
  const [newCliente, setNewCliente] = useState<Cliente>(emptyCliente)
  const [savingCliente, setSavingCliente] = useState(false)
  const [clienteErrors, setClienteErrors] = useState<Record<string, string>>({})
  const [clienteError, setClienteError] = useState('')

  const loadClientes = () => getClientes().then(setClientes)

  useEffect(() => {
    Promise.all([getEmpresa(), getClientes()]).then(([emp, cls]) => {
      setEmpresa(emp)
      setClientes(cls)
      if (emp) {
        setCondicionPago(emp.condicion_pago || 'Contado')
        setValidez(emp.validez_oferta || '10 días')
      }
    })
    if (!isEdit) generateNumero().then(setNumero)
  }, [])

  useEffect(() => {
    if (isEdit && id) {
      getCotizacion(id).then(cot => {
        if (!cot) return
        setNumero(cot.numero); setFecha(cot.fecha)
        setCompraAgil(cot.compra_agil); setIdentificador(cot.identificador || ''); setCondicionPago(cot.condicion_pago)
        setValidez(cot.validez); setObservaciones(cot.observaciones)
        setEstado(cot.estado)
        setDetalles(cot.detalles?.length ? cot.detalles : [emptyDetalle()])
        if (cot.cliente_id) { setClienteId(cot.cliente_id); setClienteSel(cot.cliente || null) }
        if (cot.cliente?.razon_social) setClienteNombre(cot.cliente.razon_social)
      })
    }
  }, [id, isEdit])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setShowDD(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filteredClientes = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    (c.alias || '').toLowerCase().includes(clienteSearch.toLowerCase()) ||
    c.rut.includes(clienteSearch)
  )

  // clienteNombre: texto libre que el usuario escribe (nombre del cliente)
  const [clienteNombre, setClienteNombre] = useState('')

  // Cuando carga una cotización existente, poblar clienteNombre
  // (se hace en el useEffect de isEdit, ver abajo)

  const selectCliente = (c: Cliente) => {
    setClienteId(c.id!); setClienteSel(c)
    setClienteNombre(c.razon_social)
    setShowDD(false); setClienteSearch('')
    setClienteError('')
  }

  const handleClienteInput = (val: string) => {
    setClienteNombre(val)
    setClienteSearch(val)
    // Si el usuario borra o cambia el nombre, desvincula el cliente registrado
    if (clienteSel && clienteSel.razon_social !== val) {
      setClienteId(''); setClienteSel(null)
    }
    setShowDD(true)
    setClienteError('')
  }

  const updateDetalle = (idx: number, field: keyof DetalleCotizacion, value: string | number) => {
    setDetalles(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      if (field === 'cantidad' || field === 'valor_unitario') {
        const qty = field === 'cantidad' ? Number(value) : next[idx].cantidad
        const price = field === 'valor_unitario' ? Number(value) : next[idx].valor_unitario
        next[idx].subtotal = qty * price
      }
      return next
    })
  }

  const setDetalleImg = (idx: number, img: string | undefined) => {
    setDetalles(prev => prev.map((d, i) => i === idx ? { ...d, imagen: img } : d))
  }

  const handleImgUpload = (idx: number, file: File) => {
    const reader = new FileReader()
    reader.onload = ev => setDetalleImg(idx, ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const addDetalle = () => setDetalles(d => [...d, emptyDetalle()])
  const removeDetalle = (idx: number) => setDetalles(d => d.filter((_, i) => i !== idx))

  const subtotal = detalles.reduce((s, d) => s + d.subtotal, 0)
  const iva = Math.round(subtotal * 0.19)
  const total = subtotal + iva

  const handleSave = async () => {
    const nombreFinal = clienteNombre.trim()
    if (!nombreFinal) {
      setClienteError('El nombre del cliente es obligatorio.')
      return
    }
    setClienteError('')
    setSaving(true)
    // Si hay cliente registrado vinculado, usar ese; si no, guardar con nombre libre
    const clienteParaGuardar = clienteSel
      ? clienteSel
      : { razon_social: nombreFinal, rut: '', giro: '', direccion: '', region: '', ciudad: '', telefono: '', email: '', contacto: '' }
    const cot: Cotizacion = {
      id: isEdit ? id : undefined,
      numero, cliente_id: clienteId || undefined,
      cliente: clienteParaGuardar,
      fecha, compra_agil: compraAgil, identificador,
      condicion_pago: condicionPago, validez,
      observaciones, subtotal, iva, total, estado,
    }
    const saved = await saveCotizacion(cot, detalles)
    setSaving(false)
    navigate(`/cotizaciones/${saved.id}`)
  }

  const handlePDF = async () => {
    setGeneratingPDF(true)
    const clientePDF = clienteSel || (clienteNombre.trim() ? { razon_social: clienteNombre.trim(), rut: '', giro: '', direccion: '', region: '', ciudad: '', telefono: '', email: '', contacto: '' } : undefined)
    const cotForPDF: Cotizacion = {
      numero, cliente_id: clienteId || undefined,
      cliente: clientePDF,
      fecha, compra_agil: compraAgil,
      condicion_pago: condicionPago, validez,
      observaciones, subtotal, iva, total, estado,
      detalles,
    }
    await generatePDFNative(cotForPDF, empresa)
    setGeneratingPDF(false)
  }

  // Quick-create client
  const setNC = (k: keyof Cliente, v: string) => setNewCliente(f => ({ ...f, [k]: v }))

  const validateCliente = () => {
    const errs: Record<string, string> = {}
    if (!newCliente.razon_social.trim()) errs.razon_social = 'Requerido'
    if (newCliente.rut.trim()) {
      const { valid, error } = validateRUT(newCliente.rut)
      if (!valid) errs.rut = error!
    }
    setClienteErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveCliente = async () => {
    if (!validateCliente()) return
    setSavingCliente(true)
    const saved = await saveCliente(newCliente)
    await loadClientes()
    selectCliente(saved)
    setSavingCliente(false)
    setShowNewCliente(false)
    setNewCliente(emptyCliente)
  }

  const estadoColors: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-700',
    enviada: 'bg-blue-100 text-blue-700',
    aceptada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
  }

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-5">
      <span className="section-title">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )

  const MetaRow = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <Icon size={13} className="text-gray-300 flex-shrink-0" />
      <div className="flex-1 flex justify-between items-center gap-2">
        <span className="text-[11px] text-gray-400 flex-shrink-0">{label}</span>
        <div className="text-[13px] font-medium text-gray-800 text-right">{children}</div>
      </div>
    </div>
  )

  return (
    <div className="p-5 sm:p-8 max-w-[1200px] mx-auto">

      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="btn-secondary !px-3 !min-h-[40px]" style={{ borderRadius: 10 }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
              {isEdit ? `Cotización ${numero}` : 'Nueva Cotización'}
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              {isEdit ? 'Editando cotización existente' : 'Crea una nueva cotización para tu cliente'}
            </p>
          </div>
        </div>
        <div />
      </div>

      {/* ── MAIN CARD ── */}
      <div className="card">
        <div className="p-7 sm:p-10">

          {/* HEADER — 65/35 grid, full card width */}
          <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>

            {/* Col izquierda: Logo + Empresa */}
            <div className="flex items-start gap-4 py-1">
              {empresa?.logo && (
                <img src={empresa.logo} alt="logo" className="w-auto object-contain flex-shrink-0" style={{ height: 54 }} />
              )}
              <div className="pt-0.5">
                <p className="text-[16px] font-bold text-gray-900 leading-tight mb-1.5">
                  {empresa?.razon_social || 'Mi Empresa'}
                </p>
                <div className="flex flex-col" style={{ gap: 2 }}>
                  {empresa?.rut       && <span className="text-[11.5px] text-gray-500">RUT {empresa.rut}</span>}
                  {empresa?.giro      && <span className="text-[11.5px] text-gray-500">{empresa.giro}</span>}
                  {empresa?.direccion && <span className="text-[11.5px] text-gray-500">{empresa.direccion}</span>}
                  {[empresa?.ciudad, empresa?.region].filter(Boolean).length > 0 && (
                    <span className="text-[11.5px] text-gray-500">
                      {[empresa?.ciudad, empresa?.region].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {empresa?.telefono  && <span className="text-[11.5px] text-gray-500">Tel. {empresa.telefono}</span>}
                  {empresa?.email     && <span className="text-[11.5px] text-gray-500">{empresa.email}</span>}
                </div>
              </div>
            </div>

            {/* Col derecha: Tarjeta azul — ocupa toda la columna */}
            <div className="rounded-2xl text-center flex flex-col items-center justify-center py-5 px-6"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1845C0 100%)', boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}>
              <p className="text-[9px] font-semibold text-blue-300 uppercase tracking-[0.15em] mb-1">Cotización N°</p>
              <input
                className="font-bold font-mono text-white text-[26px] bg-transparent border-0 focus:outline-none focus:ring-0 w-full text-center p-0 placeholder-blue-300 leading-tight"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="260721-1"
              />
              <div className="mt-3 pt-3 w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <input
                  type="date" value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="border-0 text-[12px] text-blue-200 focus:outline-none cursor-pointer bg-transparent text-center p-0 w-full font-medium"
                  style={{ colorScheme: 'dark' }}
                />
                {empresa?.ejecutivo && (
                  <p className="text-[12px] text-blue-100 font-medium mt-1">{empresa.ejecutivo}</p>
                )}
              </div>
            </div>
          </div>

          <div className="h-px mb-6" style={{ background: '#F1F5F9' }} />

          {/* CLIENTE + CONDICIONES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-8">

            {/* Cliente */}
            <div>
              <SectionTitle>Cliente</SectionTitle>
              <div className="relative" ref={ddRef}>
                <label className="label">Razón Social <span className="text-red-400">*</span></label>
                <div className="relative mb-3">
                  <input
                    className={`input pr-10 ${clienteError ? '!border-red-400' : ''}`}
                    placeholder="Escribe o busca el cliente..."
                    value={clienteNombre}
                    onChange={e => handleClienteInput(e.target.value)}
                    onFocus={() => setShowDD(true)}
                  />
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                </div>
                {clienteError && (
                  <p className="text-[12px] text-red-500 mb-2 font-medium">{clienteError}</p>
                )}
                {showDD && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white z-20 flex flex-col"
                    style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    <div className="overflow-y-auto" style={{ maxHeight: 224 }}>
                    {filteredClientes.map(c => (
                      <button key={c.id} onClick={() => selectCliente(c)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <div className="font-semibold text-[14px]">
                          {c.razon_social}
                          {c.alias && <span className="font-normal text-gray-400 ml-1.5">({c.alias})</span>}
                        </div>
                        {c.rut && <div className="text-[12px] text-gray-400 mt-0.5">{c.rut}</div>}
                      </button>
                    ))}
                    {filteredClientes.length === 0 && (
                      <p className="px-4 py-3 text-[13px] text-gray-400">Sin resultados para "{clienteNombre}"</p>
                    )}
                    </div>
                    <button
                      onClick={() => { setShowDD(false); setShowNewCliente(true); setNewCliente({ ...emptyCliente, razon_social: clienteNombre }) }}
                      className="w-full text-left px-4 py-3 text-[13px] text-blue-600 font-semibold hover:bg-blue-50 flex items-center gap-2 flex-shrink-0"
                      style={{ borderTop: '1px solid #F1F5F9' }}
                    >
                      <Plus size={14} /> Registrar nuevo cliente
                    </button>
                  </div>
                )}

                {/* Ficha cliente */}
                {clienteSel && (
                  <div className="rounded-xl p-4 mt-1" style={{ background: '#F8FAFC', border: '1.5px solid #ECECEC' }}>
                    <div className="grid grid-cols-2 gap-3">
                      {clienteSel.rut && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">RUT</p>
                          <p className="text-[13px] font-semibold text-gray-800">{clienteSel.rut}</p>
                        </div>
                      )}
                      {clienteSel.giro && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Giro</p>
                          <p className="text-[13px] font-medium text-gray-700 truncate">{clienteSel.giro}</p>
                        </div>
                      )}
                      {clienteSel.direccion && (
                        <div className="col-span-2">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Dirección</p>
                          <p className="text-[13px] text-gray-700">{clienteSel.direccion}</p>
                        </div>
                      )}
                      {clienteSel.email && (
                        <div className="col-span-2">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                          <p className="text-[13px] text-gray-700">{clienteSel.email}</p>
                        </div>
                      )}
                      {clienteSel.contacto && (
                        <div className="col-span-2">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Atención</p>
                          <p className="text-[13px] text-gray-700">{clienteSel.contacto}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Condiciones */}
            <div>
              <SectionTitle>Condiciones</SectionTitle>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Condición de pago</label>
                    <input className="input" value={condicionPago} onChange={e => setCondicionPago(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Validez de oferta</label>
                    <input className="input" value={validez} onChange={e => setValidez(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Proceso de Compra</label>
                  <input className="input" placeholder="Ej: 3784-83-COT26" value={compraAgil} onChange={e => setCompraAgil(e.target.value)} />
                </div>
                <div>
                  <label className="label">Identificador <span className="text-gray-400 font-normal text-[11px]">(solo en cotización)</span></label>
                  <input className="input" placeholder="Ej: REF-2024-001" value={identificador} onChange={e => setIdentificador(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* TABLA PRODUCTOS */}
          <div className="mb-8">
            <SectionTitle>Detalle de productos / servicios</SectionTitle>
            <div style={{ border: '1.5px solid #ECECEC', borderRadius: 14, overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[780px] table-fixed">
                  <thead>
                    <tr style={{ background: '#111827' }}>
                      <th className="px-4 py-3.5 text-center text-[11px] font-bold tracking-wider text-white w-14">IMG</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold tracking-wider text-white">PRODUCTO</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-bold tracking-wider text-white">DESCRIPCIÓN</th>
                      <th className="px-4 py-3.5 text-center text-[11px] font-bold tracking-wider text-white w-24">CANT.</th>
                      <th className="px-3 py-3.5 text-left text-[11px] font-bold tracking-wider text-white w-28">UNIDAD</th>
                      <th className="px-4 py-3.5 text-right text-[11px] font-bold tracking-wider text-white w-36">V. UNIT.</th>
                      <th className="px-4 py-3.5 text-right text-[11px] font-bold tracking-wider text-white w-32">SUBTOTAL</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((d, idx) => (
                      <tr key={idx}
                        className="align-middle transition-colors"
                        style={{ background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
                        <td className="px-3 py-3 text-center">
                          <div className="flex justify-center">
                            <ProductImageCell
                              imagen={d.imagen}
                              onUpload={file => handleImgUpload(idx, file)}
                              onRemove={() => setDetalleImg(idx, undefined)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="input text-[14px] font-semibold"
                            placeholder="Nombre del producto"
                            value={d.producto}
                            onChange={e => updateDetalle(idx, 'producto', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            className="input text-[13px] resize-y"
                            rows={4}
                            placeholder="Descripción (opcional)"
                            value={d.descripcion}
                            onChange={e => updateDetalle(idx, 'descripcion', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number" min="0"
                            className="input text-center text-[14px] font-semibold"
                            style={{ padding: '8px 6px' }}
                            value={d.cantidad === 0 ? '' : d.cantidad}
                            onChange={e => updateDetalle(idx, 'cantidad', e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            className="input text-[13px]"
                            value={d.unidad}
                            onChange={e => updateDetalle(idx, 'unidad', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 font-medium pointer-events-none">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="input text-right text-[14px] font-medium"
                              style={{ padding: '8px 10px 8px 20px' }}
                              value={d.valor_unitario === 0 ? '' : new Intl.NumberFormat('es-CL').format(d.valor_unitario)}
                              onChange={e => {
                                const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                                updateDetalle(idx, 'valor_unitario', raw === '' ? 0 : parseInt(raw, 10))
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-[15px] font-bold whitespace-nowrap" style={{ color: '#111827' }}>
                          {formatCLP(d.subtotal)}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {detalles.length > 1 && (
                            <button onClick={() => removeDetalle(idx)}
                              className="text-gray-200 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3.5" style={{ background: '#F8FAFC', borderTop: '1.5px solid #ECECEC' }}>
                <button onClick={addDetalle}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-[13px] font-semibold transition-colors hover:bg-blue-50 px-3 py-1.5 rounded-lg -ml-3">
                  <Plus size={14} /> Agregar producto
                </button>
              </div>
            </div>
          </div>

          {/* OBSERVACIONES + TOTALES */}
          <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
            <div className="flex-1 min-w-0">
              <label className="label">Observaciones / Condiciones</label>
              <textarea
                className="input resize-none"
                rows={5}
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Despacho, vigencia, condiciones especiales..."
              />
            </div>

            <div className="w-full sm:w-72 flex-shrink-0">
              <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #ECECEC' }}>
                <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <span className="text-[13px] text-gray-500">Subtotal neto</span>
                  <span className="text-[14px] font-semibold text-gray-800">{formatCLP(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <span className="text-[13px] text-gray-500">IVA (19%)</span>
                  <span className="text-[14px] font-semibold text-gray-800">{formatCLP(iva)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1845C0 100%)' }}>
                  <span className="text-[13px] font-bold text-blue-100 uppercase tracking-wider">Total</span>
                  <span className="text-[22px] font-bold text-white">{formatCLP(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Datos bancarios */}
          {empresa?.datos_bancarios && (
            <div className="pt-6" style={{ borderTop: '1.5px solid #F1F5F9' }}>
              <p className="section-title mb-3">Datos bancarios</p>
              <pre className="text-[13px] text-gray-500 whitespace-pre-wrap font-sans leading-relaxed">{empresa.datos_bancarios}</pre>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM SAVE BAR ── */}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={handlePDF} disabled={generatingPDF} className="btn-secondary px-6">
          <FileDown size={15} />
          {generatingPDF ? 'Generando...' : 'Descargar PDF'}
        </button>
        <button onClick={() => setConfirmSave(true)} disabled={saving} className="btn-primary px-8">
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar cotización'}
        </button>
      </div>

      <ConfirmModal
        open={confirmSave}
        title={isEdit ? 'Guardar cambios' : 'Guardar cotización'}
        message={isEdit ? '¿Guardar los cambios en esta cotización?' : '¿Guardar la cotización?'}
        confirmLabel="Guardar"
        danger={false}
        onConfirm={() => { setConfirmSave(false); handleSave() }}
        onCancel={() => setConfirmSave(false)}
      />

      {/* MODAL NUEVO CLIENTE */}
      {showNewCliente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="px-7 py-5 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: '1.5px solid #F1F5F9', borderRadius: '20px 20px 0 0' }}>
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">Registrar nuevo cliente</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Los datos se guardan para futuras cotizaciones</p>
              </div>
              <button onClick={() => setShowNewCliente(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg">✕</button>
            </div>
            <div className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Razón Social *</label>
                <input
                  className={`input ${clienteErrors.razon_social ? '!border-red-400' : ''}`}
                  value={newCliente.razon_social}
                  onChange={e => setNC('razon_social', e.target.value)}
                />
                {clienteErrors.razon_social && <p className="text-[12px] text-red-500 mt-1.5">{clienteErrors.razon_social}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Alias</label>
                <input className="input" placeholder="Ej: Muni Chillán" value={newCliente.alias || ''} onChange={e => setNC('alias', e.target.value)} />
              </div>
              <div>
                <label className="label">RUT</label>
                <RutInput value={newCliente.rut} onChange={v => setNC('rut', v)} />
                {clienteErrors.rut && <p className="text-[12px] text-red-500 mt-1.5">{clienteErrors.rut}</p>}
              </div>
              <div>
                <label className="label">Giro</label>
                <input className="input" value={newCliente.giro} onChange={e => setNC('giro', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Dirección</label>
                <input className="input" value={newCliente.direccion} onChange={e => setNC('direccion', e.target.value)} />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input className="input" placeholder="Ej: Chillán" value={newCliente.ciudad} onChange={e => setNC('ciudad', e.target.value)} />
              </div>
              <div>
                <label className="label">Comuna</label>
                <input className="input" placeholder="Ej: Chillán" value={newCliente.comuna || ''} onChange={e => setNC('comuna', e.target.value)} />
              </div>
              <div>
                <label className="label">Región</label>
                <input className="input" placeholder="Ej: Ñuble" value={newCliente.region} onChange={e => setNC('region', e.target.value)} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" value={newCliente.telefono} onChange={e => setNC('telefono', e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={newCliente.email} onChange={e => setNC('email', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Persona de contacto</label>
                <input className="input" value={newCliente.contacto} onChange={e => setNC('contacto', e.target.value)} />
              </div>
            </div>
            <div className="px-7 py-5 flex justify-end gap-3" style={{ borderTop: '1.5px solid #F1F5F9' }}>
              <button onClick={() => setShowNewCliente(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSaveCliente} disabled={savingCliente} className="btn-primary">
                {savingCliente ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
