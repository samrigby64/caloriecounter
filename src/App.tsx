import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import BottomNav from './components/BottomNav'
import ConfigNeeded from './components/ConfigNeeded'
import Spinner from './components/Spinner'
import Login from './pages/Login'
import Today from './pages/Today'
import Add from './pages/Add'
import Progress from './pages/Progress'
import Settings from './pages/Settings'

export default function App() {
  const { session, loading } = useAuth()

  if (!isSupabaseConfigured) return <ConfigNeeded />

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <main className="flex-1 overflow-y-auto pb-24">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/add" element={<Add />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
