import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Ingresa tu correo'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) {
      setError('No se pudo enviar el correo. Verifica la dirección.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
            <FileText size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Recuperar contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de Cotizaciones</p>
        </div>

        <div className="card p-6">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <div>
                <label className="label">Correo electrónico</label>
                <input
                  className="input"
                  type="email"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  autoFocus
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                  <ArrowLeft size={12} /> Volver al inicio de sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <CheckCircle size={44} className="mx-auto text-green-500" />
              <div>
                <p className="font-semibold text-gray-900">¡Correo enviado!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Revisa tu bandeja de entrada en <span className="font-medium">{email}</span> y sigue el enlace para crear una nueva contraseña.
                </p>
              </div>
              <Link to="/login" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                <ArrowLeft size={12} /> Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
