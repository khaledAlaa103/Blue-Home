import { useEffect, useId, useState } from 'react'
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
  // The logo appears in the header and footer at once; a per-instance id keeps their gradients separate.
  const gradient = `logo-grad-${useId().replace(/:/g, '')}`
  return (
    <span className="logo">
      <svg className="logo-mark" viewBox="0 0 44 44" aria-hidden="true">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0e2744" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="13" fill={`url(#${gradient})`} />
        <path d="M10 21.5 L22 11.5 L34 21.5" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 19.5 V32.5 H30.5 V19.5" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 32.5 V25.5 H25 V32.5" fill="#8fc0ff" />
      </svg>
      <span className="logo-text">
        <strong lang="en">BLUE HOME</strong>
        <small>بلو هوم</small>
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
