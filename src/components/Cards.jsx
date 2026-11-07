import { useState } from 'react'
import { Link } from 'react-router-dom'
import { directVideo, formatNumber, formatPrice, statusLabel, videoEmbed } from '../format'
import { starsLabel } from '../../shared/constants.js'
import { Price } from './PriceGate'
import { useLang } from '../i18n'

const ICONS = {
  land: <><path d="M3 20h18" /><path d="M5 20l3-6h8l3 6" /><path d="M9.5 14l-1 6M14.5 14l1 6" /><path d="M12 3a3 3 0 0 1 3 3c0 2.2-3 5-3 5s-3-2.8-3-5a3 3 0 0 1 3-3Z" /><circle cx="12" cy="6" r="1" /></>,
  building: <><path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" /><path d="M15 10h3a1 1 0 0 1 1 1v10" /><path d="M3 21h18" /><path d="M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1" /></>,
  shop: <><path d="M4 10v10h16V10" /><path d="M3 10l2-6h14l2 6Z" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M10 20v-5h4v5" /></>,
  house: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></>,
  hotel: <><path d="M4 21V7l8-4 8 4v14" /><path d="M3 21h18" /><path d="M9 21v-4h6v4" /><path d="M8 10h1M11.5 10h1M15 10h1M8 13.5h1M11.5 13.5h1M15 13.5h1" /></>,
}

function iconOf(type) {
  if (type === 'أرض') return ICONS.land
  if (type === 'شقة' || type === 'إداري' || type === 'عقار') return ICONS.building
  if (type === 'محل تجاري') return ICONS.shop
  if (type === 'فندق') return ICONS.hotel
  return ICONS.house
}

// Branded stand-in for a listing with no photo or video, so it still looks finished.
export function NoPhoto({ type, label, large = false }) {
  const { t } = useLang()
  return (
    <div className={large ? 'ph ph-brand large' : 'ph ph-brand'} role="img" aria-label={label || (type ? t(type) : t('بلو هوم'))}>
      <span className="ph-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{iconOf(type)}</svg>
      </span>
      {type ? <strong className="ph-type">{t(type)}</strong> : null}
      <span className="ph-brand-name" lang="en">BLUE HOME</span>
      {large ? <span className="ph-note">{t('تواصل معنا وهنبعتلك صور وفيديو العقار')}</span> : null}
    </div>
  )
}

// whole: show the full photo (no cropping) over a blurred copy of itself that fills the frame.
export function Cover({ src, alt, whole = false, type }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <NoPhoto type={type} label={alt} />
  if (!whole) return <img src={src} alt={alt} onError={() => setFailed(true)} />
  return (
    <span className="cover-whole">
      <img className="cover-fill" src={src} alt="" aria-hidden="true" />
      <img className="cover-main" src={src} alt={alt} onError={() => setFailed(true)} />
    </span>
  )
}

// No photos but a video: show the video's opening frame (or YouTube's thumbnail) as the card picture.
function VideoCover({ url, alt, type }) {
  const file = directVideo(url)
  if (file) {
    return (
      <span className="cover-whole">
        <video className="cover-main" src={`${file}#t=0.5`} muted playsInline preload="metadata" aria-label={alt} />
        <span className="play-badge" aria-hidden="true">▶</span>
      </span>
    )
  }
  const youtube = (videoEmbed(url).match(/youtube\.com\/embed\/([\w-]+)/) || [])[1]
  if (!youtube) return <Cover alt={alt} type={type} />
  return (
    <>
      <Cover src={`https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`} alt={alt} type={type} whole />
      <span className="play-badge" aria-hidden="true">▶</span>
    </>
  )
}

// Arabic counting: 3-10 take the plural (5 أدوار), other numbers the singular (12 دور).
function countLabel(count, one, few) {
  return `${count} ${count >= 3 && count <= 10 ? few : one}`
}

export function ListingCard({ item }) {
  const { t } = useLang()
  const photo = item.images?.[0]
  return (
    <article className="card">
      <Link to={`/property/${item.id}`} className="card-media">
        {!photo && item.videoUrl ? <VideoCover url={item.videoUrl} alt={item.title} type={item.type} /> : <Cover src={photo} alt={item.title} type={item.type} whole />}
        <span className={`pill st-${item.status}`}>{t(statusLabel(item.status))}</span>
      </Link>
      <div className="card-body">
        <p className="meta">{t(item.type)} · {item.areaName}</p>
        <h3><Link to={`/property/${item.id}`}>{item.title}</Link></h3>
        {item.projectName ? <p className="quiet">{item.projectName}</p> : null}
        <ul className="facts-inline">
          {item.areaSqm ? <li>{t(`${formatNumber(item.areaSqm)} م²`)}</li> : null}
          {item.floorsCount ? <li>{t(countLabel(item.floorsCount, 'دور', 'أدوار'))}</li> : null}
          {item.unitsCount ? <li>{t(countLabel(item.unitsCount, 'وحدة', 'وحدات'))}</li> : null}
          {item.stars ? <li>{t(starsLabel(item.stars))}</li> : null}
          {item.hotelRooms ? <li>{t(countLabel(item.hotelRooms, 'غرفة', 'غرف'))}</li> : null}
          {item.rooms ? <li>{t(`${item.rooms} غرف`)}</li> : null}
          {item.baths ? <li>{t(`${item.baths} حمام`)}</li> : null}
        </ul>
        <div className="card-foot">
          {item.price != null ? <Price as="strong" className="price">{t(formatPrice(item.price))}</Price> : <span className="quiet">{t('السعر غير مُدخل')}</span>}
          {item.pricePerMeter != null ? <Price className="ppm" placeholder="00,000 / م²">{t(`${formatNumber(item.pricePerMeter)} / م²`)}</Price> : null}
        </div>
      </div>
    </article>
  )
}
