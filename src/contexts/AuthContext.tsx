import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase, isDemoMode } from '../lib/supabase'

const DEMO_SESSION = {
  user: { email: 'demo@portafolio.cl', id: 'demo-user' },
} as unknown as Session

interface AuthContextType {
  session: Session | null
  loading: boolean
  isRecovery: boolean
  clearRecovery: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isRecovery: false,
  clearRecovery: () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(isDemoMode() ? DEMO_SESSION : null)
  const [loading, setLoading] = useState(!isDemoMode())
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    if (isDemoMode()) return   // demo: sesión fija, sin backend

    // Listener primero — así PASSWORD_RECOVERY se captura antes de setLoading(false)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const clearRecovery = () => setIsRecovery(false)

  const signOut = async () => {
    if (isDemoMode()) return   // demo: no cerrar sesión
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, isRecovery, clearRecovery, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
