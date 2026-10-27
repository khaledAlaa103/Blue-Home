import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { ListingCard } from '../components/Cards'
import { Gallery } from '../components/Gallery'
import { InquiryForm } from '../components/InquiryForm'
import { Price } from '../components/PriceGate'
import { directVideo, formatDate, formatNumber, formatPrice, mapEmbed, mapLink, operationLabel, paymentLabel, statusLabel, telLink, useTitle, videoEmbed, waLink } from '../format'

export default function PropertyDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const [item, setItem] = useState(null)
  const [similar, setSimilar] = useState([])
  const [site, setSite] = useState(null)
  const [error, setError] = useState('')
  useTitle(item?.title || 'تفاصيل العقار')

  useEffect(() => {
    let live = true
    setItem(null)
    setError('')
    api.listing(id, params.get('preview') === '1').then((data) => { if (live) setItem(data) }).catch((err) => { if (live) setError(err.message) })
    api.similar(id).then((data) => { if (live) setSimilar(data.items || []) }).catch(() => {})
    api.bootstrap().then((data) => { if (live) setSite(data) }).catch(() => {})
    return () => { live = false }
  }, [id, params])

  if (error) return <p className="container msg-err">{error}</p>
  if (!item) return <p className="container state">جارٍ التحميل…</p>
  const phone = site?.settings?.phone
  const whatsapp = site?.settings?.whatsapp
  const message = `مرحباً، أرغب في الاستفسار عن «${item.title}»${item.areaName ? ` في ${item.areaName}` : ''}`
  const rows = [
    ['النوع', item.type],
    ['العملية', operationLabel(item.operation)],
    ['المنطقة', item.areaName],
    ['العنوان', item.address],
    ['المساحة', item.areaSqm ? `${formatNumber(item.areaSqm)} م²` : ''],
    ['الغرف', item.rooms || ''],
    ['الحمامات', item.baths || ''],
    ['السداد', paymentLabel(item.paymentType)],
    ['المقدم', item.downPayment != null ? <Price>{formatPrice(item.downPayment)}</Price> : ''],
    ['القسط', item.installmentAmount != null ? <Price placeholder="00,000 ج.م">{formatPrice(item.installmentAmount)}</Price> : ''],
    ['مدة التقسيط', item.installmentMonths ? `${item.installmentMonths} شهر` : ''],
    ['ملاحظة السداد', item.paymentNote],
    ['سعر المتر', item.pricePerMeter != null ? <Price placeholder="00,000 ج.م">{formatPrice(item.pricePerMeter)}</Price> : ''],
    ['الحالة', statusLabel(item.status)],
    ['آخر تحديث', formatDate(item.updatedAt)],
  ].filter(([, value]) => value)
  const embed = videoEmbed(item.videoUrl)
  const file = directVideo(item.videoUrl)
  const map = mapEmbed(item.lat, item.lng)
  return (
    <div className="container">
      <header className="page-head">
        <p className="crumbs"><Link to="/">الرئيسية</Link> / <Link to={item.type === 'أرض' ? '/lands' : '/units'}>{item.type === 'أرض' ? 'الأراضي' : 'الوحدات'}</Link></p>
        <h1>{item.title}</h1>
        <p className="quiet">{item.type} · {item.areaName}</p>
      </header>
      <div className="detail">
        <div className="detail-main">
          <Gallery images={item.images || []} title={item.title} />
          {item.description ? <section className="section"><h2>الوصف</h2><p>{item.description}</p></section> : null}
          {item.features?.length ? <ul className="feature-list">{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : null}
          {item.projectName ? <p>{item.projectPublished ? <Link to={`/projects/${item.projectId}`}>المشروع: {item.projectName}</Link> : `المشروع: ${item.projectName}`}</p> : null}
          {embed ? <iframe className="video" src={embed} title="فيديو العقار" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : null}
          {file ? <video className="video" src={file} controls /> : null}
          {item.virtualTourUrl ? <p><a className="btn btn-line" href={item.virtualTourUrl} target="_blank" rel="noreferrer">الجولة الافتراضية</a></p> : null}
          {map ? (
            <section className="section">
              <h2>الموقع</h2>
              <iframe className="video" title="خريطة العقار" src={map} />
              <a href={mapLink(item.lat, item.lng)} target="_blank" rel="noreferrer">فتح الخريطة</a>
            </section>
          ) : null}
        </div>
        <aside className="facts">
          {item.price != null ? <Price as="p" className="price-lg">{formatPrice(item.price)}</Price> : <p className="quiet">السعر غير مُدخل بعد</p>}
          <span className={`pill st-${item.status}`} style={{ position: 'static' }}>{statusLabel(item.status)}</span>
          <dl className="kv">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <div className="cta-row">
            {phone ? <a className="btn btn-primary" href={telLink(phone)}>اتصال</a> : null}
            {whatsapp ? <a className="btn btn-wa" href={waLink(whatsapp, message)} target="_blank" rel="noreferrer">واتساب</a> : null}
          </div>
          {!phone && !whatsapp ? <p className="quiet">أرقام الاتصال المباشر غير مضافة بعد.</p> : null}
          <h2>طلب معاينة أو تفاصيل</h2>
          <InquiryForm listingId={item.id} projectId={item.projectId} allowViewing={item.status === 'available'} />
        </aside>
      </div>
      {similar.length ? (
        <section className="section">
          <h2>عقارات قريبة في نفس المنطقة</h2>
          <div className="grid-cards three">{similar.map((entry) => <ListingCard key={entry.id} item={entry} />)}</div>
        </section>
      ) : null}
    </div>
  )
}
