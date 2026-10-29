import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AUTH_EVENT, getToken } from '../api'

const NOTICE_KEY = 'bluehome_price_notice'

export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken()))
  useEffect(() => {
    const sync = () => setSignedIn(Boolean(getToken()))
    window.addEventListener(AUTH_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return signedIn
}

// Guests get a blurred placeholder, never the real number, so it can't be read from the page.
export function Price({ as: Tag = 'span', className, placeholder = '0,000,000 ج.م', children }) {
  const signedIn = useSignedIn()
  return (
    <Tag className={className}>
      {signedIn ? children : (
        <Link to="/signup" className="price-locked" title="الأسعار تظهر بعد التسجيل">
          <span className="price-blur" aria-hidden="true">{placeholder}</span>
          <span className="sr-only">السعر يظهر بعد التسجيل</span>
        </Link>
      )}
    </Tag>
  )
}

export function PriceNotice() {
  const signedIn = useSignedIn()
  const path = useLocation().pathname
  const [seen, setSeen] = useState(() => {
    try { return sessionStorage.getItem(NOTICE_KEY) === '1' } catch { return false }
  })

  function close() {
    try { sessionStorage.setItem(NOTICE_KEY, '1') } catch { /* private mode */ }
    setSeen(true)
  }

  useEffect(() => {
    if (signedIn || seen) return undefined
    const onKey = (event) => { if (event.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [signedIn, seen])

  if (signedIn || seen || path === '/signup' || path === '/login') return null
  return (
    <div className="notice-backdrop" onClick={close}>
      <div className="notice" role="dialog" aria-modal="true" aria-labelledby="price-notice-title" aria-describedby="price-notice-text" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="notice-close" aria-label="إغلاق" onClick={close}>×</button>
        <span className="notice-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
            <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
            <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <p className="notice-kicker">حصري للأعضاء</p>
        <h2 id="price-notice-title">سجّل مجاناً لعرض الأسعار</h2>
        <p id="price-notice-text">أنشئ حسابك في بلو هوم خلال دقيقة واحدة، واطّلع على الأسعار الكاملة لكل العقارات والوحدات.</p>
        <ul className="notice-perks">
          <li>أسعار كل الشقق والفلل والأراضي والمحلات</li>
          <li>تفاصيل المقدّم والأقساط وسعر المتر</li>
          <li>تواصل مباشر مع فريق المبيعات</li>
        </ul>
        <div className="notice-actions">
          <Link className="btn btn-primary" to="/signup" onClick={close}>إنشاء حساب مجاني</Link>
          <Link className="btn btn-line" to="/login" onClick={close}>لديّ حساب: تسجيل الدخول</Link>
        </div>
        <button type="button" className="notice-later" onClick={close}>تصفّح بدون أسعار</button>
      </div>
    </div>
  )
}
