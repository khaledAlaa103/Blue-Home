import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { api } from './api'

export function RequireAdmin() {
  const [state, setState] = useState('load')
  useEffect(() => {
    api.me().then((user) => setState(user ? 'in' : 'out')).catch((error) => setState(error.status === 401 ? 'out' : 'err'))
  }, [])
  if (state === 'load') return <p className="state container">جارٍ التحقق…</p>
  if (state === 'err') return <p className="state container">تعذر الاتصال بالخادم.</p>
  if (state === 'out') return <Navigate to="/admin/login" replace />
  return <Outlet />
}
