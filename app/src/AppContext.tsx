import { createContext, useContext, useState } from 'react'

const AppContext = createContext<any>(null)

// un unico contexto global para toda la app, asi no pasamos props por todos lados
export function AppProvider(props: any) {
  const [user, setUser] = useState<any>(null)
  const [filtro, setFiltro] = useState('')
  const [alumnos, setAlumnos] = useState<any>([])
  const [cuotas, setCuotas] = useState<any>([])

  const value = { user, setUser, filtro, setFiltro, alumnos, setAlumnos, cuotas, setCuotas }

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
