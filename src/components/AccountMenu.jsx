import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'

const ADMIN_LINKS = [
  ['/admin', 'نظرة عامة'],
  ['/admin/properties', 'العقارات'],
  ['/admin/listings', 'الإعلانات'],
  ['/admin/areas', 'المناطق'],
  ['/admin/customers', 'العملاء'],
  ['/admin/inquiries', 'الطلبات'],
  ['/admin/testimonials', 'الآراء'],
  ['/admin/settings', 'الإعدادات'],
]

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(undefined)
  const box = useRef(null)
  const path = useLocation().pathname
  const navigate = useNavigate()

  useEffect(() => {
    let live = true
    api.me().then((next) => { if (live) setUser(next) }).catch(() => { if (live) setUser(null) })
    return () => { live = false }
  }, [path])

  useEffect(() => { setOpen(false) }, [path])

  useEffect(() => {
    function onPointer(event) {
      if (!box.current?.contains(event.target)) setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function logout() {
    setToken(null)
    setUser(null)
    setOpen(false)
    navigate('/')
  }

  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username : ''

  return (
    <div className={user ? 'account' : 'account account-guest'} ref={box}>
      {user === null ? (
        <div className="auth-links">
          <Link to="/login">Login</Link>
          <Link className="auth-signup" to="/signup">Sign up</Link>
        </div>
      ) : null}
      <button className="account-btn" type="button" aria-expanded={open} aria-haspopup="menu" aria-label="الحساب" onClick={() => setOpen((value) => !value)}>
        <UserIcon />
      </button>
      {open ? (
        <div className="account-menu" role="menu">
          {user?.role === 'admin' ? (
            <>
              <p className="account-name">{name}</p>
              {ADMIN_LINKS.map(([to, label]) => <Link key={to} to={to} role="menuitem">{label}</Link>)}
              <button type="button" role="menuitem" onClick={logout}>خروج</button>
            </>
          ) : null}
          {user && user.role !== 'admin' ? (
            <>
              <p className="account-name">{name}</p>
              <button type="button" role="menuitem" onClick={logout}>خروج</button>
            </>
          ) : null}
          {!user ? (
            <>
              <Link to="/login" role="menuitem">Login</Link>
              <Link to="/signup" role="menuitem">Sign up</Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export { UserIcon }
