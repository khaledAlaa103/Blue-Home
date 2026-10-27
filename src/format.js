import { useEffect } from 'react'
import { labelOf, OPERATIONS, PAYMENTS, STATUSES, REQUEST_TYPES } from '../shared/constants.js'

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | بلو هوم` : 'بلو هوم | Blue Home'
  }, [title])
}

export function formatPrice(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return ''
  return `${new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 }).format(Number(value))} ج.م`
}

export function formatNumber(value) {
  if (value == null || value === '') return ''
  return new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 }).format(Number(value))
}

export function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', numberingSystem: 'latn' }).format(date)
}

export const operationLabel = (id) => labelOf(OPERATIONS, id)
export const paymentLabel = (id) => labelOf(PAYMENTS, id)
export const statusLabel = (id) => labelOf(STATUSES, id)
export const requestLabel = (id) => labelOf(REQUEST_TYPES, id)

export function waLink(raw, message) {
  let digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `20${digits.slice(1)}`
  else if (/^1[0125]\d{8}$/.test(digits)) digits = `20${digits}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

// "أ وب وج": Arabic attaches و to the next word.
export function arabicList(items) {
  return items.filter(Boolean).join(' و')
}

// One number covers both: WhatsApp falls back to the phone when no separate WhatsApp number is set.
export function contactNumbers(settings) {
  const phone = settings?.phone || ''
  return { phone, whatsapp: settings?.whatsapp || phone }
}

export function telLink(raw) {
  const digits = String(raw || '').replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

export function videoEmbed(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]
      return /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : ''
    }
    if (parsed.hostname.endsWith('youtube.com')) {
      const id = parsed.searchParams.get('v') || (parsed.pathname.match(/\/embed\/([\w-]{6,})/) || [])[1]
      return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : ''
    }
    if (parsed.hostname.endsWith('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      return /^\d+$/.test(id || '') ? `https://player.vimeo.com/video/${id}` : ''
    }
  } catch {
    return ''
  }
  return ''
}

export function directVideo(url) {
  if (!url) return ''
  if (/^\/uploads\/videos\/[a-f0-9]{16}\.(mp4|mov|webm|m4v)$/.test(url)) return url
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' && parsed.pathname.toLowerCase().endsWith('.mp4')) return parsed.href
  } catch {
    return ''
  }
  return ''
}

export function mapEmbed(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) return ''
  const pad = 0.02
  const bbox = `${ln - pad},${la - pad},${ln + pad},${la + pad}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${la},${ln}`)}`
}

export function mapLink(lat, lng) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
}
