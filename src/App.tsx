import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { EmpresaProvider } from './contexts/EmpresaContext'
import { isSupabaseConfigured, isDemoMode } from './lib/supabase'
import { seedDemoData } from './lib/demoSeed'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Configuracion from './pages/Configuracion'
import NuevaCotizacion from './pages/NuevaCotizacion'
import Historial from './pages/Historial'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function NotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)' }}>
      <div className="max-w-md w-full card p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: '#FEF3C7' }}>
          <span className="text-2xl">⚙️</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900">Supabase no configurado</h1>
        <p className="text-sm text-gray-500">
          Crea el archivo <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> en la raíz del proyecto con:
        </p>
        <pre className="text-left text-xs bg-gray-900 text-green-400 rounded-xl p-4 font-mono leading-relaxed">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="text-xs text-gray-400">
          Luego reinicia el servidor con <code className="bg-gray-100 px-1 rounded font-mono">npm run dev</code>
        </p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { session, loading, isRecovery } = useAuth()

  if (loading) return null

  if (isRecovery) {
    return (
      <Routes>
        <Route path="*" element={<ResetPassword />} />
      </Routes>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <EmpresaProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
        <Route path="/cotizaciones/:id" element={<NuevaCotizacion />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
    </EmpresaProvider>
  )
}

export default function App() {
  if (isDemoMode()) seedDemoData()
  if (!isDemoMode() && !isSupabaseConfigured()) return <NotConfigured />

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
