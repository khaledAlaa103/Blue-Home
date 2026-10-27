import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
  return (
    <div className="dash">
      <header className="dash-top">
        <NavLink to="/admin"><Logo /></NavLink>
        <nav className="pills">
          {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'}>{label}</NavLink>)}
        </nav>
        <NavLink className="btn btn-line btn-sm" to="/">الموقع</NavLink>
        <button className="btn btn-navy btn-sm" type="button" onClick={() => { setToken(null); navigate('/') }}>خروج</button>
      </header>
      <div className="dash-body"><Outlet /></div>
    </div>
  )
}
