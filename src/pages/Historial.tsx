import { useEffect, useState, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Eye, EyeOff, Pencil, Copy, Trash2, FileText } from 'lucide-react'
import { getCotizaciones, getCotizacion, saveCotizacion, deleteCotizacion, generateNumero } from '../lib/storage'
import { getEmpresa } from '../lib/storage'
import { generatePDFNative } from '../lib/pdf'
import { Cotizacion, DetalleCotizacion } from '../types'
import { formatCLP, formatDate } from '../lib/utils'
import ConfirmModal from '../components/ConfirmModal'


type ModalType = 'edit' | 'duplicate' | 'delete' | null

export default function Historial() {
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ type: ModalType; id: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedData, setExpandedData] = useState<Cotizacion | null>(null)
  const [expandLoading, setExpandLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await getCotizaciones()
    setCotizaciones(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = cotizaciones.filter(c =>
    c.numero.toLowerCase().includes(search.toLowerCase()) ||
    (c.cliente?.razon_social || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.identificador || '').toLowerCase().includes(search.toLowerCase()) ||
    c.fecha.includes(search)
  )

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedData(null)
      return
    }
    setExpandedId(id)
    setExpandedData(null)
    setExpandLoading(true)
    const data = await getCotizacion(id)
    setExpandedData(data)
    setExpandLoading(false)
  }

  const closeModal = () => setModal(null)

  const handleConfirm = async () => {
    if (!modal) return
    const { type, id } = modal
    closeModal()
    if (type === 'edit') {
      navigate(`/cotizaciones/${id}`)
    } else if (type === 'duplicate') {
      const cot = await getCotizacion(id)
      if (!cot) return
      const nuevoNumero = await generateNumero()
      const { id: _id, created_at: _ca, ...rest } = cot
      await saveCotizacion(
        { ...rest, numero: nuevoNumero, estado: 'enviada', detalles: undefined, cliente: undefined },
        cot.detalles || []
      )
      await load()
    } else if (type === 'delete') {
      await deleteCotizacion(id)
      if (expandedId === id) { setExpandedId(null); setExpandedData(null) }
      await load()
    }
  }

  const selectedNum = cotizaciones.find(c => c.id === modal?.id)?.numero ?? ''
  const modalConfig = {
    edit: { title: 'Editar cotización', message: `¿Abrir la cotización N° ${selectedNum} para editarla?`, confirmLabel: 'Editar', danger: false },
    duplicate: { title: 'Duplicar cotización', message: `Se creará una copia de la cotización N° ${selectedNum}.`, confirmLabel: 'Duplicar', danger: false },
    delete: { title: 'Eliminar cotización', message: `¿Eliminar la cotización N° ${selectedNum}? Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', danger: true },
  }
  const mc = modal?.type ? modalConfig[modal.type] : null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cotizaciones.length} cotizaciones en total</p>
        </div>
        <Link to="/cotizaciones/nueva" className="btn-primary">+ Nueva Cotización</Link>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 w-80" placeholder="Buscar por número, cliente o fecha..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No se encontraron cotizaciones.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs text-gray-500 font-medium w-6"></th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium">N°</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium">Cliente</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium">Identificador</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium">Fecha</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium text-right">Total</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium w-36">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const isOpen = expandedId === c.id
                return (
                  <Fragment key={c.id}>
                    <tr className={`border-b border-gray-50 transition-colors ${isOpen ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="pl-3 pr-0 py-3 w-2" />
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                          {c.numero}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.cliente?.razon_social || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{c.identificador || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(c.fecha)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCLP(c.total)}</td>
                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-0.5">
                          <ActionBtn title={isOpen ? 'Cerrar' : 'Ver detalle'} onClick={() => toggleExpand(c.id!)} active={isOpen}>
                            {isOpen ? <EyeOff size={13} /> : <Eye size={13} />}
                          </ActionBtn>
                          <ActionBtn title="Duplicar" onClick={() => setModal({ type: 'duplicate', id: c.id! })}>
                            <Copy size={13} />
                          </ActionBtn>
                          <ActionBtn title="Editar" onClick={() => setModal({ type: 'edit', id: c.id! })}>
                            <Pencil size={13} />
                          </ActionBtn>
                          <ActionBtn title="Eliminar" onClick={() => setModal({ type: 'delete', id: c.id! })} danger>
                            <Trash2 size={13} />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isOpen && (
                      <tr key={`${c.id}-expand`} className="border-b border-blue-100 bg-blue-50/30">
                        <td colSpan={7} className="px-6 py-4">
                          {expandLoading && !expandedData ? (
                            <p className="text-xs text-gray-400 py-2">Cargando...</p>
                          ) : expandedData ? (
                            <ExpandedDetail cot={expandedData} />
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {mc && (
        <ConfirmModal open={!!modal} title={mc.title} message={mc.message}
          confirmLabel={mc.confirmLabel} danger={mc.danger}
          onConfirm={handleConfirm} onCancel={closeModal} />
      )}
    </div>
  )
}

function ExpandedDetail({ cot }: { cot: Cotizacion }) {
  const detalles: DetalleCotizacion[] = cot.detalles || []

  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="flex flex-wrap gap-6 text-xs">
        {cot.cliente && (
          <div>
            <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Cliente</p>
            <p className="text-gray-800 font-medium">{cot.cliente.razon_social}</p>
            {cot.cliente.rut && <p className="text-gray-500">RUT {cot.cliente.rut}</p>}
          </div>
        )}
        {cot.condicion_pago && (
          <div>
            <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Condición de pago</p>
            <p className="text-gray-700">{cot.condicion_pago}</p>
          </div>
        )}
        {cot.validez && (
          <div>
            <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Validez</p>
            <p className="text-gray-700">{cot.validez}</p>
          </div>
        )}
        {cot.compra_agil && (
          <div>
            <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Proceso de Compra</p>
            <p className="text-gray-700">{cot.compra_agil}</p>
          </div>
        )}
      </div>

      {/* Productos */}
      {detalles.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-blue-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-3 py-2 text-left font-medium">Producto</th>
                <th className="px-3 py-2 text-center font-medium w-16">Cant.</th>
                <th className="px-3 py-2 text-right font-medium w-28">V. Unit.</th>
                <th className="px-3 py-2 text-right font-medium w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {detalles.map((d, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-800">{d.producto}</p>
                    {d.descripcion && <p className="text-gray-400 mt-0.5">{d.descripcion}</p>}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">{d.cantidad} {d.unidad}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{formatCLP(d.valor_unitario)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-800">{formatCLP(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totales */}
      <div className="flex justify-end">
        <div className="text-xs space-y-1 w-48">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal neto</span><span>{formatCLP(cot.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>IVA (19%)</span><span>{formatCLP(cot.iva)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
            <span>Total</span><span>{formatCLP(cot.total)}</span>
          </div>
        </div>
      </div>

      {cot.observaciones && (
        <div className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-blue-100">
          <span className="font-semibold text-gray-400 uppercase tracking-wide">Observaciones: </span>
          {cot.observaciones}
        </div>
      )}
    </div>
  )
}

function ActionBtn({ children, title, onClick, danger, active }: {
  children: React.ReactNode; title: string; onClick: () => void; danger?: boolean; active?: boolean
}) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        danger   ? 'text-gray-300 hover:text-red-500 hover:bg-red-50'
        : active ? 'text-blue-600 bg-blue-50'
                 : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
      }`}>
      {children}
    </button>
  )
}
