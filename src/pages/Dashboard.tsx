import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCotizaciones } from '../lib/storage'
import { Cotizacion } from '../types'
import { formatCLP, formatDate } from '../lib/utils'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']


export default function Dashboard() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const now = new Date()
  const [mesIdx, setMesIdx]   = useState(now.getMonth())
  const [anio, setAnio]       = useState(now.getFullYear())

  useEffect(() => {
    getCotizaciones().then(setCotizaciones)
  }, [])

  const filtradas = cotizaciones.filter(c => {
    // Parse local (evita corrimiento por zona horaria de "YYYY-MM-DD" como UTC)
    const [yy, mm] = c.fecha.split('-').map(Number)
    return (mm - 1) === mesIdx && yy === anio
  })

  const cantidad = filtradas.length
  const monto    = filtradas.reduce((s, c) => s + c.total, 0)

  const prevMes = () => {
    if (mesIdx === 0) { setMesIdx(11); setAnio(a => a - 1) }
    else setMesIdx(m => m - 1)
  }
  const nextMes = () => {
    if (mesIdx === 11) { setMesIdx(0); setAnio(a => a + 1) }
    else setMesIdx(m => m + 1)

  }
  const esHoy = mesIdx === now.getMonth() && anio === now.getFullYear()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen de cotizaciones por mes</p>
        </div>
        <Link to="/cotizaciones/nueva" className="btn-primary">
          <Plus size={16} />
          Nueva Cotización
        </Link>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevMes}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">{MESES[mesIdx]}</span>
          <span className="text-lg font-bold text-gray-400">{anio}</span>
        </div>
        <button onClick={nextMes} disabled={esHoy}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
        {!esHoy && (
          <button onClick={() => { setMesIdx(now.getMonth()); setAnio(now.getFullYear()) }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-1">
            Hoy
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Cotizaciones</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{cantidad}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Monto del mes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCLP(monto)}</p>
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Cotizaciones — {MESES[mesIdx]} {anio}
          </h2>
          <Link to="/historial" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver historial
          </Link>
        </div>
        {filtradas.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No hay cotizaciones en {MESES[mesIdx]} {anio}.
            </p>
            {esHoy && (
              <Link to="/cotizaciones/nueva" className="btn-primary mt-4 inline-flex">
                <Plus size={14} /> Crear cotización
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtradas.map(c => (
              <Link
                key={c.id}
                to={`/cotizaciones/${c.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                    {c.numero}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.cliente?.razon_social || '—'}</p>
                    <p className="text-xs text-gray-400">{formatDate(c.fecha)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{formatCLP(c.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
