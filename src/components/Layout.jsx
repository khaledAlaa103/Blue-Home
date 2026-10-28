import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { api } from '../api'
import { arabicList, contactNumbers, telLink, useCanonical, waLink } from '../format'
import { AccountMenu } from './AccountMenu'
import { PriceNotice, useSignedIn } from './PriceGate'
import { InstallPrompt } from './InstallPrompt'

const SiteContext = { current: null }
export function useSite() {
  return SiteContext.current
}

export function Logo() {
  return (
    <span className="logo">
      <svg className="logo-mark" viewBox="0 0 38 38" aria-hidden="true">
        <rect width="38" height="38" rx="12" fill="#10243e" />
        <path d="M8 18 L19 9 L30 18 V29 H8Z" fill="none" stroke="white" strokeWidth="2" />
        <path d="M16 29 V21 H22 V29" fill="none" stroke="#8eb6ef" strokeWidth="2" />
      </svg>
      <span>
        <strong>بلو هوم</strong>
        <small>BLUE HOME</small>
      </span>
    </span>
  )
}

function Header({ open, setOpen }) {
  const signedIn = useSignedIn()
  return (
    <header className="header">
      <div className="container topbar">
        <Link to="/" className="logo-link" aria-label="بلو هوم"><Logo /></Link>
        <button className="nav-toggle" type="button" aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((value) => !value)}>
          <span className="nav-toggle-icon" aria-hidden="true"><span /><span /><span /></span>
        </button>
        <nav id="site-nav" className={open ? 'nav open' : 'nav'}>
          <NavLink to="/" end>الرئيسية</NavLink>
          <NavLink to="/projects">المشاريع</NavLink>
          <NavLink to="/units">الوحدات</NavLink>
          <NavLink to="/lands">الأراضي</NavLink>
          <NavLink to="/about">من نحن</NavLink>
          <NavLink to="/contact">تواصل معنا</NavLink>
          {signedIn ? null : (
            <div className="nav-auth">
              <Link className="btn btn-line" to="/login">Login</Link>
              <Link className="btn btn-primary" to="/signup">Sign up</Link>
            </div>
          )}
        </nav>
        <AccountMenu />
      </div>
    </header>
  )
}

function Footer({ site }) {
  const settings = site?.settings || {}
  const { phone, whatsapp } = contactNumbers(settings)
  const areaNames = arabicList((site?.areas || []).map((area) => area.name))
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="quiet">عرض الوحدات والمشاريع والأراضي{areaNames ? ` في ${areaNames}` : ''}</p>
        </div>
        <div>
          <strong>الصفحات</strong>
          <Link to="/projects">المشاريع</Link>
          <Link to="/units">الوحدات</Link>
          <Link to="/lands">الأراضي</Link>
          <Link to="/search">بحث متقدم</Link>
        </div>
        <div>
          <strong>المناطق</strong>
          {(site?.areas || []).map((area) => <Link key={area.id} to={`/search?areaId=${area.id}`}>{area.name}</Link>)}
        </div>
        <div>
          <strong>التواصل</strong>
          {phone ? <a href={telLink(phone)}>اتصال: <bdi dir="ltr">{phone}</bdi></a> : null}
          {whatsapp ? <a href={waLink(whatsapp, 'مرحباً، أود الاستفسار عن عروض بلو هوم.')} target="_blank" rel="noreferrer">واتساب</a> : null}
          {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : null}
          {settings.address ? <span>{settings.address}</span> : null}
          {settings.facebook ? <a href={settings.facebook} target="_blank" rel="noreferrer">فيسبوك</a> : null}
          {settings.instagram ? <a href={settings.instagram} target="_blank" rel="noreferrer">إنستغرام</a> : null}
          {settings.youtube ? <a href={settings.youtube} target="_blank" rel="noreferrer">يوتيوب</a> : null}
          <Link to="/contact">تواصل معنا</Link>
        </div>
      </div>
      <div className="container legal">© {year} بلو هوم</div>
    </footer>
  )
}

export function PublicLayout() {
  const [site, setSite] = useState(null)
  const [open, setOpen] = useState(false)
  const path = useLocation().pathname
  SiteContext.current = site
  useCanonical(path)
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [path])
  useEffect(() => { api.bootstrap().then(setSite).catch(() => setSite(null)) }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('menu-lock', open)
    return () => document.documentElement.classList.remove('menu-lock')
  }, [open])
  const { whatsapp } = contactNumbers(site?.settings)
  return (
    <>
      <Header open={open} setOpen={setOpen} />
      {open ? <button type="button" className="nav-backdrop" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} /> : null}
      <main><Outlet context={site} /></main>
      <Footer site={site} />
      <PriceNotice />
      <InstallPrompt />
      {whatsapp ? <a className="wa-float" href={waLink(whatsapp, 'مرحباً، أود الاستفسار عن عروض بلو هوم.')} target="_blank" rel="noreferrer">واتساب</a> : null}
    </>
  )
}
