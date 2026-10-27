import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { api } from './api'

export function RequireAdmin() {
  const [state, setState] = useState('load')
  const [user, setUser] = useState(null)
  useEffect(() => {
    api.me().then((next) => {
      setUser(next)
      setState(next ? 'in' : 'out')
    }).catch((error) => setState(error.status === 401 ? 'out' : 'err'))
  }, [])
  if (state === 'load') return <p className="state container">جارٍ التحقق…</p>
  if (state === 'err') return <p className="state container">تعذر الاتصال بالخادم.</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
