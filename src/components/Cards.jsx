import { useState } from 'react'
import { Link } from 'react-router-dom'
import { directVideo, formatNumber, formatPrice, statusLabel, videoEmbed } from '../format'
import { Price } from './PriceGate'

const ICONS = {
  land: <><path d="M3 20h18" /><path d="M5 20l3-6h8l3 6" /><path d="M9.5 14l-1 6M14.5 14l1 6" /><path d="M12 3a3 3 0 0 1 3 3c0 2.2-3 5-3 5s-3-2.8-3-5a3 3 0 0 1 3-3Z" /><circle cx="12" cy="6" r="1" /></>,
  building: <><path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" /><path d="M15 10h3a1 1 0 0 1 1 1v10" /><path d="M3 21h18" /><path d="M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1" /></>,
  shop: <><path d="M4 10v10h16V10" /><path d="M3 10l2-6h14l2 6Z" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M10 20v-5h4v5" /></>,
  house: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></>,
}

function iconOf(type) {
  if (type === 'أرض') return ICONS.land
  if (type === 'شقة' || type === 'إداري') return ICONS.building
  if (type === 'محل تجاري') return ICONS.shop
  return ICONS.house
}

// Branded stand-in for a listing with no photo or video, so it still looks finished.
export function NoPhoto({ type, label, large = false }) {
  return (
    <div className={large ? 'ph ph-brand large' : 'ph ph-brand'} role="img" aria-label={label || type || 'بلو هوم'}>
      <span className="ph-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{iconOf(type)}</svg>
      </span>
      {type ? <strong className="ph-type">{type}</strong> : null}
      <span className="ph-brand-name" lang="en">BLUE HOME</span>
      {large ? <span className="ph-note">تواصل معنا وهنبعتلك صور وفيديو العقار</span> : null}
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

export function ListingCard({ item }) {
  const photo = item.images?.[0]
  return (
    <article className="card">
      <Link to={`/property/${item.id}`} className="card-media">
        {!photo && item.videoUrl ? <VideoCover url={item.videoUrl} alt={item.title} type={item.type} /> : <Cover src={photo} alt={item.title} type={item.type} whole />}
        <span className={`pill st-${item.status}`}>{statusLabel(item.status)}</span>
      </Link>
      <div className="card-body">
        <p className="meta">{item.type} · {item.areaName}</p>
        <h3><Link to={`/property/${item.id}`}>{item.title}</Link></h3>
        {item.projectName ? <p className="quiet">{item.projectName}</p> : null}
        <ul className="facts-inline">
          {item.areaSqm ? <li>{formatNumber(item.areaSqm)} م²</li> : null}
          {item.rooms ? <li>{item.rooms} غرف</li> : null}
          {item.baths ? <li>{item.baths} حمام</li> : null}
        </ul>
        <div className="card-foot">
          {item.price != null ? <Price as="strong" className="price">{formatPrice(item.price)}</Price> : <span className="quiet">السعر غير مُدخل</span>}
          {item.pricePerMeter != null ? <Price className="ppm" placeholder="00,000 / م²">{formatNumber(item.pricePerMeter)} / م²</Price> : null}
        </div>
      </div>
    </article>
  )
}
