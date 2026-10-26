import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatNumber, formatPrice, statusLabel } from '../format'

export function Cover({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div className="ph" role="img" aria-label={alt}><span>{alt}</span></div>
  return <img src={src} alt={alt} onError={() => setFailed(true)} />
}

export function ListingCard({ item }) {
  return (
    <article className="card">
      <Link to={`/property/${item.id}`} className="card-media">
        <Cover src={item.images?.[0]} alt={item.title} />
        <span className={`pill st-${item.status}`}>{statusLabel(item.status)}</span>
        {item.isSample ? <span className="pill sample">تجريبي</span> : null}
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
          {item.price != null ? <strong className="price">{formatPrice(item.price)}</strong> : <span className="quiet">السعر غير مُدخل</span>}
          {item.pricePerMeter != null ? <span className="ppm">{formatNumber(item.pricePerMeter)} / م²</span> : null}
        </div>
      </div>
    </article>
  )
}

export function ProjectCard({ item }) {
  return (
    <article className="card project-card">
      <Link to={`/projects/${item.id}`} className="card-media">
        <Cover src={item.images?.[0]} alt={item.name} />
        {item.isSample ? <span className="pill sample">تجريبي</span> : null}
      </Link>
      <div className="card-body">
        <p className="meta">{item.areaName}{item.developer ? ` · ${item.developer}` : ''}</p>
        <h3><Link to={`/projects/${item.id}`}>{item.name}</Link></h3>
        <p className="quiet">{item.listingCount ? `${item.listingCount} وحدة منشورة` : 'لا توجد وحدات منشورة بعد'}</p>
      </div>
    </article>
  )
}
