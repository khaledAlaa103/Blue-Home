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
      <div className="notice" role="dialog" aria-modal="true" aria-labelledby="price-notice-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="price-notice-title">الأسعار للمسجلين</h2>
        <p>الأسعار هتظهر بمجرد ما تعمل Sign up. التسجيل مجاني وبياخد دقيقة.</p>
        <div className="notice-actions">
          <Link className="btn btn-primary" to="/signup" onClick={close}>Sign up</Link>
          <Link className="btn btn-line" to="/login" onClick={close}>عندي حساب</Link>
        </div>
        <button type="button" className="notice-later" onClick={close}>تصفح بدون أسعار</button>
      </div>
    </div>
  )
}
