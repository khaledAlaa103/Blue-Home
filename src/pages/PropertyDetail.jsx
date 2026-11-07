import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { ListingCard } from '../components/Cards'
import { Gallery } from '../components/Gallery'
import { InquiryForm } from '../components/InquiryForm'
import { Price } from '../components/PriceGate'
import { PropertyMap } from '../components/PropertyMap'
import { DELIVERIES, FINISHINGS, HOTEL_STATES, HOTEL_TYPE, LEGAL_STATES, labelOf, starsLabel } from '../../shared/constants.js'
import { useLang } from '../i18n'
import { contactNumbers, directVideo, formatDate, formatNumber, formatPrice, coordsOf, mapLink, operationLabel, paymentLabel, statusLabel, telLink, useTitle, videoEmbed, waLink } from '../format'

export default function PropertyDetail() {
  const { t, lang } = useLang()
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
  if (!item) return <p className="container state">{t('جارٍ التحميل…')}</p>
  const { phone, whatsapp } = contactNumbers(site?.settings)
  const message = lang === 'en'
    ? `Hello, I would like to ask about "${item.title}"${item.areaName ? ` in ${item.areaName}` : ''}`
    : `مرحباً، أرغب في الاستفسار عن «${item.title}»${item.areaName ? ` في ${item.areaName}` : ''}`
  const rows = [
    ['النوع', item.type],
    ['العملية', operationLabel(item.operation)],
    ['المنطقة', item.areaName],
    ['العنوان', item.address],
    [item.section === 'properties' || item.type === HOTEL_TYPE ? 'مساحة الأرض' : 'المساحة', item.areaSqm ? `${formatNumber(item.areaSqm)} م²` : ''],
    ['التصنيف', starsLabel(item.stars)],
    ['عدد الغرف الفندقية', item.hotelRooms || ''],
    ['حالة التشغيل', labelOf(HOTEL_STATES, item.hotelState)],
    ['الترخيص السياحي', item.licensed ? 'مرخّص' : ''],
    ['عدد الأدوار', item.floorsCount || ''],
    ['عدد الوحدات', item.unitsCount || ''],
    ['الغرف', item.rooms || ''],
    ['الحمامات', item.baths || ''],
    ['الدور', item.floor],
    ['التشطيب', labelOf(FINISHINGS, item.finishing)],
    ['الاستلام', [labelOf(DELIVERIES, item.delivery), item.delivery === 'construction' ? item.deliveryNote : ''].filter(Boolean).join(' · ')],
    ['الوضع القانوني', labelOf(LEGAL_STATES, item.legal)],
    ['السداد', paymentLabel(item.paymentType)],
    ['المقدم', item.downPayment != null ? <Price>{t(formatPrice(item.downPayment))}</Price> : ''],
    ['القسط', item.installmentAmount != null ? <Price placeholder="00,000 ج.م">{t(formatPrice(item.installmentAmount))}</Price> : ''],
    ['مدة التقسيط', item.installmentMonths ? `${item.installmentMonths} شهر` : ''],
    ['ملاحظة السداد', item.paymentNote],
    ['سعر المتر', item.pricePerMeter != null ? <Price placeholder="00,000 ج.م">{t(formatPrice(item.pricePerMeter))}</Price> : ''],
    ['الحالة', statusLabel(item.status)],
    ['آخر تحديث', formatDate(item.updatedAt, lang === 'en' ? 'en-GB' : 'ar-EG')],
  ].filter(([, value]) => value).map(([label, value]) => [t(label), typeof value === 'string' ? t(value) : value])
  const embed = videoEmbed(item.videoUrl)
  const file = directVideo(item.videoUrl)
  const map = coordsOf(item.lat, item.lng)
  const video = embed
    ? <iframe className="video" src={embed} title={t('فيديو العقار')} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    : file ? <video className="video" src={file} controls playsInline preload="metadata" onLoadedMetadata={(event) => event.currentTarget.setAttribute('data-sized', '')} /> : null
  const videoFirst = Boolean(video) && !item.images?.length
  return (
    <div className="container">
      <header className="page-head">
        <p className="crumbs"><Link to="/">{t('الرئيسية')}</Link> / <Link to={item.type === 'أرض' ? '/lands' : '/units'}>{item.type === 'أرض' ? t('الأراضي') : t('الوحدات')}</Link></p>
        <h1>{item.title}</h1>
        <p className="quiet">{t(item.type)} · {item.areaName}</p>
      </header>
      <div className="detail">
        <div className="detail-main">
          {/* No photos but a video: the video takes the gallery's place at the top. */}
          {videoFirst ? video : <Gallery images={item.images || []} title={item.title} type={item.type} />}
          {item.description ? <section className="section"><h2>{t('الوصف')}</h2><p>{item.description}</p></section> : null}
          {item.features?.length ? <ul className="feature-list">{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : null}
          {item.projectName ? <p>{item.projectPublished ? <Link to={`/projects/${item.projectId}`}>{t('المشروع')}: {item.projectName}</Link> : `${t('المشروع')}: ${item.projectName}`}</p> : null}
          {videoFirst ? null : video}
          {item.virtualTourUrl ? <p><a className="btn btn-line" href={item.virtualTourUrl} target="_blank" rel="noreferrer">{t('الجولة الافتراضية')}</a></p> : null}
          {map ? (
            <section className="section">
              <h2>{t('الموقع')}</h2>
              <PropertyMap coords={map} label={t(item.type)} title={t(`موقع ${item.title}`)} />
              <a className="btn btn-line map-open" href={mapLink(item.lat, item.lng)} target="_blank" rel="noreferrer">{t('فتح في خرائط جوجل')}</a>
            </section>
          ) : null}
        </div>
        <aside className="facts">
          {item.price != null ? <Price as="p" className="price-lg">{t(formatPrice(item.price))}</Price> : <p className="quiet">{t('السعر غير مُدخل بعد')}</p>}
          {item.negotiable && item.price != null ? <span className="negotiable">{t('السعر قابل للتفاوض')}</span> : null}
          <span className={`pill st-${item.status}`} style={{ position: 'static' }}>{t(statusLabel(item.status))}</span>
          <dl className="kv">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <div className="cta-row">
            {phone ? <a className="btn btn-primary" href={telLink(phone)}>{t('اتصال')}</a> : null}
            {whatsapp ? <a className="btn btn-wa" href={waLink(whatsapp, message)} target="_blank" rel="noreferrer">{t('واتساب')}</a> : null}
          </div>
          {!phone && !whatsapp ? <p className="quiet">{t('أرقام الاتصال المباشر غير مضافة بعد.')}</p> : null}
          <h2>{t('طلب معاينة أو تفاصيل')}</h2>
          <InquiryForm listingId={item.id} projectId={item.projectId} allowViewing={item.status === 'available'} />
        </aside>
      </div>
      {similar.length ? (
        <section className="section">
          <h2>{t('عقارات قريبة في نفس المنطقة')}</h2>
          <div className="grid-cards three">{similar.map((entry) => <ListingCard key={entry.id} item={entry} />)}</div>
        </section>
      ) : null}
    </div>
  )
}
