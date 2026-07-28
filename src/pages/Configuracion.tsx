import { useEffect, useState, useRef } from 'react'
import { Save, Upload, Trash2 } from 'lucide-react'
import { getEmpresa, saveEmpresa } from '../lib/storage'
import { useEmpresa } from '../contexts/EmpresaContext'
import { Empresa } from '../types'
import RutInput from '../components/RutInput'
import { validateRUT } from '../lib/utils'
import FirmaCanvas from '../components/FirmaCanvas'
import ConfirmModal from '../components/ConfirmModal'

const empty: Empresa = {
  logo: '', razon_social: '', rut: '', giro: '', direccion: '',
  region: '', ciudad: '', telefono: '', email: '', ejecutivo: '',
  condicion_pago: 'Crédito (30 días)', validez_oferta: '10 días',
  datos_bancarios: '',
}

export default function Configuracion() {
  const { reload } = useEmpresa()
  const [form, setForm] = useState<Empresa>(empty)
  const [savedForm, setSavedForm] = useState<Empresa>(empty)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const [logoFileName, setLogoFileName] = useState('')

  useEffect(() => {
    getEmpresa().then(e => { if (e) { setForm(e); setSavedForm(e) } })
  }, [])

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm)

  const set = (k: keyof Empresa, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => set('logo', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
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
    await saveEmpresa(form)
    await reload()
    setSavedForm(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Datos de tu empresa que aparecerán en todas las cotizaciones</p>
      </div>

      <div className="card p-6 space-y-6">
        {/* Logo */}
        <div className="pb-2" style={{ minHeight: 150 }}>
          <label className="label mb-3">Logo de la empresa</label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Preview */}
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 116, height: 116,
                background: '#FAFBFD',
                border: '1px solid #E7EDF5',
                borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                padding: 10,
              }}
            >
              {form.logo ? (
                <img src={form.logo} alt="logo"
                  className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-300 text-center leading-relaxed select-none">Sin logo</span>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="btn-secondary"
                style={{ height: 40, paddingLeft: 18, paddingRight: 18 }}
              >
                <Upload size={15} /> Subir logo
              </button>
              <p className="text-xs text-gray-400">PNG o JPG · Fondo blanco recomendado</p>
              {logoFileName && !form.logo && (
                <p className="text-xs text-gray-400 truncate max-w-[200px]">{logoFileName}</p>
              )}
              {form.logo && logoFileName && (
                <p className="text-xs text-gray-400 truncate max-w-[200px]">{logoFileName}</p>
              )}
              {form.logo && (
                <button
                  onClick={() => { set('logo', ''); setLogoFileName('') }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors w-fit"
                >
                  <Trash2 size={13} /> Eliminar logo
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        <div className="h-px bg-gray-100" />

        {/* Datos principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="label">Razón Social</label>
            <input className="input" value={form.razon_social} onChange={e => set('razon_social', e.target.value)} />
          </div>
          <div>
            <label className="label">RUT</label>
            <RutInput value={form.rut} onChange={v => set('rut', v)} />
            {errors.rut && <p className="text-xs text-red-500 mt-1">{errors.rut}</p>}
          </div>
          <div className="lg:col-span-2">
            <label className="label">Giro</label>
            <input className="input" value={form.giro} onChange={e => set('giro', e.target.value)} />
          </div>
          <div>
            <label className="label">Ejecutivo</label>
            <input className="input" value={form.ejecutivo} onChange={e => set('ejecutivo', e.target.value)} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Dirección</label>
            <input className="input" value={form.direccion} onChange={e => set('direccion', e.target.value)} />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input className="input" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} />
          </div>
          <div>
            <label className="label">Región</label>
            <input className="input" value={form.region} onChange={e => set('region', e.target.value)} placeholder="Ej: Ñuble" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Condición de pago por defecto</label>
            <input className="input" value={form.condicion_pago} onChange={e => set('condicion_pago', e.target.value)} />
          </div>
          <div>
            <label className="label">Validez de oferta por defecto</label>
            <input className="input" value={form.validez_oferta} onChange={e => set('validez_oferta', e.target.value)} />
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Apariencia del sistema */}
        <div>
          <p className="section-title mb-4">Apariencia del sistema</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre en la barra lateral</label>
              <input className="input" placeholder="Cotizaciones" value={form.nombre_sistema || ''} onChange={e => set('nombre_sistema', e.target.value)} />
              <p className="text-[11px] text-gray-400 mt-1.5">Texto principal del sidebar. Por defecto: "Cotizaciones"</p>
            </div>
            <div>
              <label className="label">Subtítulo en la barra lateral</label>
              <input className="input" placeholder="Sistema SITI" value={form.subtitulo_sistema || ''} onChange={e => set('subtitulo_sistema', e.target.value)} />
              <p className="text-[11px] text-gray-400 mt-1.5">Texto secundario bajo el nombre. Por defecto: "Sistema SITI"</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* ── PDF: Datos Bancarios + Firma Digital ── */}
        <div>
          <p className="section-title mb-5">Configuración del PDF</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Datos bancarios */}
            <div className="flex flex-col">
              <label className="label mb-2">Datos bancarios</label>
              <p className="text-[11px] text-gray-400 mb-3">Aparecen en el PDF debajo de las observaciones</p>
              <textarea
                className="input flex-1"
                style={{
                  minHeight: 200,
                  resize: 'none',
                  fontSize: 15,
                  lineHeight: 1.6,
                  padding: '16px 18px',
                  overflowY: 'hidden',
                  height: 'auto',
                }}
                placeholder={`Banco de Chile\nCuenta Vista N° 200223138\nRUT: 76.892.993-9\nEmail: finanzas@miempresa.cl`}
                value={form.datos_bancarios || ''}
                rows={Math.max(6, (form.datos_bancarios || '').split('\n').length + 1)}
                onChange={e => {
                  set('datos_bancarios', e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.max(200, e.target.scrollHeight) + 'px'
                }}
                onFocus={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.max(200, e.target.scrollHeight) + 'px'
                }}
              />
            </div>

            {/* Firma digital */}
            <div className="flex flex-col">
              <label className="label mb-2">Firma digital</label>
              <p className="text-[11px] text-gray-400 mb-3">Aparece sobre la línea de firma en el PDF</p>
              <FirmaCanvas
                value={form.firma || ''}
                onChange={v => set('firma', v)}
              />
            </div>
          </div>
        </div>

        {/* Guardar */}
        {isDirty && (
          <div className="pt-2 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              onClick={() => setConfirmSave(true)}
              disabled={saving}
              className="btn-primary w-full sm:w-auto"
            >
              <Save size={15} />
              {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        )}

        <ConfirmModal
          open={confirmSave}
          title="Guardar configuración"
          message="¿Guardar los cambios en la configuración de la empresa?"
          confirmLabel="Guardar"
          danger={false}
          onConfirm={() => { setConfirmSave(false); handleSave() }}
          onCancel={() => setConfirmSave(false)}
        />
      </div>
    </div>
  )
}
