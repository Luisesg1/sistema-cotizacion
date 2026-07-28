import { useEffect, useState, Fragment } from 'react'
import { Plus, Pencil, Trash2, Search, User, Eye, EyeOff } from 'lucide-react'
import { getClientes, saveCliente, deleteCliente } from '../lib/storage'
import { Cliente } from '../types'
import RutInput from '../components/RutInput'
import { validateRUT } from '../lib/utils'
import ConfirmModal from '../components/ConfirmModal'

const empty: Cliente = {
  razon_social: '', alias: '', rut: '', giro: '', direccion: '',
  region: '', ciudad: '', comuna: '', telefono: '', email: '', contacto: '',
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Cliente>(empty)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const toggleExpand = (id: string) =>
    setExpandedId(prev => prev === id ? null : id)

  const load = () => getClientes().then(setClientes)
  useEffect(() => { load() }, [])

  const filtered = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    (c.alias || '').toLowerCase().includes(search.toLowerCase()) ||
    c.rut.includes(search)
  )

  const openNew = () => { setForm(empty); setErrors({}); setModal(true) }
  const openEdit = (c: Cliente) => { setForm(c); setErrors({}); setModal(true) }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.razon_social.trim()) errs.razon_social = 'Campo requerido'
    if (form.rut.trim()) {
      const { valid, error } = validateRUT(form.rut)
      if (!valid) errs.rut = error!
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    await saveCliente(form)
    await load()
    setSaving(false)
    setModal(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteCliente(deleteId)
    setDeleteId(null)
    await load()
  }

  const set = (k: keyof Cliente, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clientes.length} clientes registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-full sm:w-72"
              placeholder="Buscar por nombre o RUT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <User size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay clientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium">Razón Social</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium">RUT</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium">Ciudad</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium">Teléfono</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium">Alias</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const isOpen = expandedId === c.id
                  return (
                    <Fragment key={c.id}>
                      <tr className={`border-b border-gray-50 transition-colors ${isOpen ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{c.razon_social}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.rut}</td>
                        <td className="px-4 py-3 text-gray-600">{[c.ciudad, c.region].filter(Boolean).join(', ')}</td>
                        <td className="px-4 py-3 text-gray-600">{c.telefono}</td>
                        <td className="px-4 py-3 text-gray-600">{c.alias}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button title={isOpen ? 'Cerrar' : 'Ver detalle'} onClick={() => toggleExpand(c.id!)}
                              className={`p-1.5 rounded-md transition-colors ${isOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                              {isOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button title="Editar" onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-50 rounded-md text-gray-400 hover:text-blue-600 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button title="Eliminar" onClick={() => setDeleteId(c.id!)} className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr key={`${c.id}-expand`} className="border-b border-blue-100 bg-blue-50/20">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                              {c.alias && (
                                <div>
                                  <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Alias</p>
                                  <p className="text-gray-700">{c.alias}</p>
                                </div>
                              )}
                              {c.giro && (
                                <div>
                                  <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Giro</p>
                                  <p className="text-gray-700">{c.giro}</p>
                                </div>
                              )}
                              {c.direccion && (
                                <div className="col-span-2">
                                  <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Dirección</p>
                                  <p className="text-gray-700">{c.direccion}</p>
                                </div>
                              )}
                              {c.email && (
                                <div>
                                  <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Email</p>
                                  <p className="text-gray-700">{c.email}</p>
                                </div>
                              )}
                              {c.telefono && (
                                <div>
                                  <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Teléfono</p>
                                  <p className="text-gray-700">{c.telefono}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Eliminar cliente"
        message={`¿Eliminar "${clientes.find(c => c.id === deleteId)?.razon_social}"? Las cotizaciones asociadas no se borrarán.`}
        confirmLabel="Eliminar"
        danger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">{form.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Razón Social *</label>
                <input
                  className={`input ${errors.razon_social ? 'border-red-400' : ''}`}
                  placeholder="Ej: I. Municipalidad de Chillán"
                  value={form.razon_social}
                  onChange={e => set('razon_social', e.target.value)}
                />
                {errors.razon_social && <p className="text-xs text-red-500 mt-1">{errors.razon_social}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Alias</label>
                <input className="input" placeholder="Ej: Muni Chillán" value={form.alias || ''} onChange={e => set('alias', e.target.value)} />
              </div>
              <div>
                <label className="label">RUT</label>
                <RutInput value={form.rut} onChange={v => set('rut', v)} />
                {errors.rut && <p className="text-xs text-red-500 mt-1">{errors.rut}</p>}
              </div>
              <div>
                <label className="label">Giro</label>
                <input className="input" placeholder="Ej: Servicios municipales" value={form.giro} onChange={e => set('giro', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Dirección</label>
                <input className="input" placeholder="Ej: Av. O'Higgins 345" value={form.direccion} onChange={e => set('direccion', e.target.value)} />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input className="input" placeholder="Ej: Chillán" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} />
              </div>
              <div>
                <label className="label">Comuna</label>
                <input className="input" placeholder="Ej: Chillán" value={form.comuna || ''} onChange={e => set('comuna', e.target.value)} />
              </div>
              <div>
                <label className="label">Región</label>
                <input className="input" placeholder="Ej: Ñuble" value={form.region} onChange={e => set('region', e.target.value)} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" placeholder="Ej: +56 9 1234 5678" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="Ej: contacto@empresa.cl" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Persona de contacto</label>
                <input className="input" placeholder="Ej: Juan Pérez" value={form.contacto} onChange={e => set('contacto', e.target.value)} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
