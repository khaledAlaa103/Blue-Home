import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatNumber, formatPrice, statusLabel } from '../format'
import { Price } from './PriceGate'

// whole: show the full photo (no cropping) over a blurred copy of itself that fills the frame.
export function Cover({ src, alt, whole = false }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div className="ph" role="img" aria-label={alt}><span>{alt}</span></div>
  if (!whole) return <img src={src} alt={alt} onError={() => setFailed(true)} />
  return (
    <span className="cover-whole">
      <img className="cover-fill" src={src} alt="" aria-hidden="true" />
      <img className="cover-main" src={src} alt={alt} onError={() => setFailed(true)} />
    </span>
  )
}

export function ListingCard({ item }) {
  return (
    <article className="card">
      <Link to={`/property/${item.id}`} className="card-media">
        <Cover src={item.images?.[0]} alt={item.title} whole />
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

