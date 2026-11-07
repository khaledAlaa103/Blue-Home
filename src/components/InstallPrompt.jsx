import { useEffect, useState } from 'react'
import { useLang } from '../i18n'

const DISMISS_KEY = 'bluehome_install_dismissed'

// Chrome fires this once, early, possibly before React mounts, so catch it at module load.
let deferredPrompt = null
const listeners = new Set()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((fn) => fn())
  })
}

function isInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function platform() {
  const ua = navigator.userAgent || ''
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/i.test(ua) || iPadOS) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return null
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="install-share">
      <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11H5v9h14v-9h-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function InstallPrompt() {
  const { t, lang } = useLang()
  const [os] = useState(platform)
  const [canPrompt, setCanPrompt] = useState(() => Boolean(deferredPrompt))
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    const sync = () => setCanPrompt(Boolean(deferredPrompt))
    listeners.add(sync)
    return () => listeners.delete(sync)
  }, [])

  function close() {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
    setHidden(true)
  }

  async function install() {
    const prompt = deferredPrompt
    if (!prompt) return
    deferredPrompt = null
    setCanPrompt(false)
    prompt.prompt()
    await prompt.userChoice.catch(() => null)
    close()
  }

  if (hidden || !os || isInstalled()) return null
  return (
    <div className="install-bar" role="dialog" aria-labelledby="install-title">
      <img src="/icons/icon-v2-192.png" alt="" className="install-icon" />
      <div className="install-text">
        <strong id="install-title">{t('نزّل أبلكيشن بلو هوم')}</strong>
        {os === 'ios' ? (
          lang === 'en' ? <span>Tap <ShareIcon /> Share, then “Add to Home Screen”.</span> : <span>دوس على <ShareIcon /> مشاركة، وبعدين «إضافة إلى الشاشة الرئيسية».</span>
        ) : canPrompt ? (
          <span>{t('افتح الموقع أسرع من أيقونة على الشاشة الرئيسية.')}</span>
        ) : (
          lang === 'en' ? <span>From the browser menu ⋮ choose “Install app” (not “Add to Home Screen”).</span> : <span>من قايمة المتصفح ⋮ اختار «تثبيت التطبيق» (مش «إضافة إلى الشاشة الرئيسية»).</span>
        )}
      </div>
      <div className="install-actions">
        {os === 'android' && canPrompt ? <button type="button" className="btn btn-primary btn-sm" onClick={install}>{t('تثبيت')}</button> : null}
        <button type="button" className="install-close" aria-label={t('إغلاق')} onClick={close}>×</button>
      </div>
    </div>
  )
}
