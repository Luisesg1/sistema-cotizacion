import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Empresa } from '../types'
import { getEmpresa } from '../lib/storage'

interface EmpresaContextType {
  empresa: Empresa | null
  reload: () => Promise<void>
}

const EmpresaContext = createContext<EmpresaContextType>({ empresa: null, reload: async () => {} })

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)

  const reload = useCallback(async () => {
    const e = await getEmpresa()
    if (e) setEmpresa(e)
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <EmpresaContext.Provider value={{ empresa, reload }}>
      {children}
    </EmpresaContext.Provider>
  )
}

export const useEmpresa = () => useContext(EmpresaContext)
