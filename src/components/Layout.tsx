import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Settings, Menu, X, Receipt, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useEmpresa } from '../contexts/EmpresaContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/cotizaciones/nueva', label: 'Nueva Cotización', icon: Receipt },
  { to: '/historial', label: 'Historial', icon: FileText },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { session, signOut } = useAuth()
  const { empresa } = useEmpresa()
  const username = session?.user?.email?.split('@')[0] || 'Usuario'
  const close = () => setOpen(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {empresa?.logo ? (
            <img src={empresa.logo} alt="logo" className="h-8 w-auto object-contain flex-shrink-0" style={{ maxWidth: 80 }} />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}>
              <FileText size={15} className="text-white" />
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{empresa?.nombre_sistema || 'Cotizaciones'}</p>
            <p className="text-[10px] text-gray-400">{empresa?.subtitulo_sistema || 'Sistema SITI'}</p>
          </div>
        </div>
        <button onClick={close} className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                size={15}
                className={`flex-shrink-0 transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}
              />
              {label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-gray-700 leading-tight">{username}</p>
            <p className="text-[10px] text-gray-400">v1.0.0</p>
          </div>
          <button
            onClick={signOut}
            title="Cerrar sesión"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F8FA' }}>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-sm" onClick={close} />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-[220px] flex-shrink-0 flex-col"
        style={{ background: '#FFFFFF', borderRight: '1.5px solid #ECECEC' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col lg:hidden transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#FFFFFF', borderRight: '1.5px solid #ECECEC' }}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white flex-shrink-0"
          style={{ borderBottom: '1.5px solid #ECECEC' }}>
          <button onClick={() => setOpen(true)} className="text-gray-500 hover:text-gray-900 transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            {empresa?.logo ? (
              <img src={empresa.logo} alt="logo" className="h-6 w-auto object-contain" style={{ maxWidth: 60 }} />
            ) : (
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
                <FileText size={12} className="text-white" />
              </div>
            )}
            <span className="font-bold text-gray-900 text-sm">{empresa?.nombre_sistema || 'Cotizaciones'}</span>
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
