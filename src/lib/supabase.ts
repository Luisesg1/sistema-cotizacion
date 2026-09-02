import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Demo mode: sin backend, todo en localStorage. Activado con VITE_DEMO_MODE=true
export const isDemoMode = () => import.meta.env.VITE_DEMO_MODE === 'true'

// En demo forzamos localStorage aunque existan llaves de Supabase
export const isSupabaseConfigured = () => !isDemoMode() && Boolean(url && key)

export const supabase = createClient(url || 'http://localhost', key || 'placeholder')
