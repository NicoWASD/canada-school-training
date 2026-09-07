import Login from './Login'
import AdminDashboard from './AdminDashboard'
import { useApp } from './AppContext'

function App() {
  const { user, setUser } = useApp()

  if (!user) {
    return <Login onLogin={(u: any) => setUser(u)} />
  }

  return <AdminDashboard user={user} />
}

export default App
