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
          <NavLink to="/properties">العقارات</NavLink>
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

const FOOT_ICONS = {
  phone: <path d="M5 4h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />,
  whatsapp: <><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7Z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2Z" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  facebook: <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2.5H8V14h2.5v6.5H14V14h2.5l.5-3.5h-3V8.5a.5.5 0 0 1 .5-.5Z" />,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r="0.6" /></>,
  youtube: <><rect x="3" y="6" width="18" height="12" rx="3.5" /><path d="m10.5 9.5 4 2.5-4 2.5Z" /></>,
}

function FootIcon({ name }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{FOOT_ICONS[name]}</svg>
}

function Footer({ site }) {
  const settings = site?.settings || {}
  const { phone, whatsapp } = contactNumbers(settings)
  const areas = site?.areas || []
  const areaNames = arabicList(areas.map((area) => area.name))
  const year = new Date().getFullYear()
  const waHref = whatsapp ? waLink(whatsapp, 'مرحباً، أود الاستفسار عن عروض بلو هوم.') : ''
  const social = [['facebook', 'فيسبوك'], ['instagram', 'إنستغرام'], ['youtube', 'يوتيوب']].filter(([key]) => settings[key])
  return (
    <footer className="footer">
      {phone || waHref ? (
        <div className="container">
          <div className="footer-cta">
            <div>
              <strong>بتدوّر على عقار مناسب؟</strong>
              <p>فريق بلو هوم يساعدك تختار الوحدة الصح بالسعر ونظام السداد اللي يناسبك.</p>
            </div>
            <div className="footer-cta-actions">
              {phone ? <a className="btn footer-btn-light" href={telLink(phone)}><FootIcon name="phone" />اتصل بنا</a> : null}
              {waHref ? <a className="btn footer-btn-wa" href={waHref} target="_blank" rel="noreferrer"><FootIcon name="whatsapp" />واتساب</a> : null}
            </div>
          </div>
        </div>
      ) : null}
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" aria-label="بلو هوم"><Logo /></Link>
          <p>شقق وفلل وأراضٍ ومحلات للبيع{areaNames ? ` في ${areaNames}` : ''}، بأسعار واضحة ونظام سداد يناسبك.</p>
          {social.length ? (
            <div className="footer-social">
              {social.map(([key, label]) => <a key={key} href={settings[key]} target="_blank" rel="noreferrer" aria-label={label} title={label}><FootIcon name={key} /></a>)}
            </div>
          ) : null}
        </div>
        <nav className="footer-col" aria-label="روابط سريعة">
          <strong>روابط سريعة</strong>
          <Link to="/properties">العقارات</Link>
          <Link to="/units">الوحدات</Link>
          <Link to="/lands">الأراضي</Link>
          <Link to="/search?offers=1">العروض</Link>
          <Link to="/search">بحث متقدم</Link>
        </nav>
        <nav className="footer-col" aria-label="الشركة">
          <strong>الشركة</strong>
          <Link to="/about">من نحن</Link>
          <Link to="/contact">تواصل معنا</Link>
          <Link to="/signup">إنشاء حساب</Link>
          <Link to="/login">تسجيل الدخول</Link>
        </nav>
        {areas.length ? (
          <nav className="footer-col footer-areas" aria-label="المناطق">
            <strong>المناطق</strong>
            {areas.map((area) => <Link key={area.id} to={`/search?areaId=${area.id}`}>{area.name}</Link>)}
          </nav>
        ) : null}
        {phone || waHref || settings.email || settings.address ? <div className="footer-col footer-contact">
          <strong>تواصل معنا</strong>
          {phone ? <a href={telLink(phone)}><FootIcon name="phone" /><bdi dir="ltr">{phone}</bdi></a> : null}
          {waHref ? <a href={waHref} target="_blank" rel="noreferrer"><FootIcon name="whatsapp" />واتساب</a> : null}
          {settings.email ? <a href={`mailto:${settings.email}`}><FootIcon name="mail" /><bdi dir="ltr">{settings.email}</bdi></a> : null}
          {settings.address ? <span><FootIcon name="pin" />{settings.address}</span> : null}
        </div> : null}
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {year} بلو هوم <span lang="en">Blue Home</span>. جميع الحقوق محفوظة.</span>
          <span lang="en" dir="ltr">bluehome7.store</span>
        </div>
      </div>
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
