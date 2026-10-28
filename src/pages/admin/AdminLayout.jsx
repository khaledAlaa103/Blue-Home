import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { setToken } from '../../api'
import { Logo } from '../../components/Layout'

const LINKS = [
  ['/admin', 'نظرة عامة'],
  ['/admin/projects', 'المشاريع'],
  ['/admin/listings', 'الإعلانات'],
  ['/admin/areas', 'المناطق'],
  ['/admin/customers', 'العملاء'],
  ['/admin/inquiries', 'الطلبات'],
  ['/admin/testimonials', 'الآراء'],
  ['/admin/settings', 'الإعدادات'],
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const path = useLocation().pathname
  const [open, setOpen] = useState(false)
  const current = [...LINKS].reverse().find(([to]) => path === to || path.startsWith(`${to}/`))?.[1] || ''

  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    document.documentElement.classList.toggle('menu-lock', open)
    return () => document.documentElement.classList.remove('menu-lock')
  }, [open])

  function logout() {
    setToken(null)
    navigate('/')
  }

  return (
    <div className="dash">
      <header className="dash-top">
        <NavLink className="dash-logo" to="/admin"><Logo /></NavLink>
        {current ? <span className="dash-current">{current}</span> : null}
        <button className="nav-toggle" type="button" aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={open} aria-controls="admin-nav" onClick={() => setOpen((value) => !value)}>
          <span className="nav-toggle-icon" aria-hidden="true"><span /><span /><span /></span>
        </button>
        <nav id="admin-nav" className={open ? 'pills open' : 'pills'}>
          {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'}>{label}</NavLink>)}
          <div className="dash-nav-extra">
            <Link className="btn btn-line" to="/">الموقع</Link>
            <button className="btn btn-navy" type="button" onClick={logout}>خروج</button>
          </div>
        </nav>
        <div className="dash-actions">
          <NavLink className="btn btn-line btn-sm" to="/">الموقع</NavLink>
          <button className="btn btn-navy btn-sm" type="button" onClick={logout}>خروج</button>
        </div>
      </header>
      {open ? <button type="button" className="nav-backdrop" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} /> : null}
      <div className="dash-body"><Outlet /></div>
    </div>
  )
}
