import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ListingCard } from '../components/Cards'
import { InquiryForm } from '../components/InquiryForm'
import { useTitle } from '../format'
import { useLang } from '../i18n'
import { PROPERTY_TYPES } from '../../shared/constants.js'

const LOOKING = [
  ['شقق', 'شقة'],
  ['فلل', 'فيلا'],
  ['تاون', 'تاون هاوس'],
  ['توين', 'توين هاوس'],
  ['أراضي', 'أرض'],
  ['محلات', 'محل تجاري'],
  ['إداري', 'إداري'],
  ['فنادق', 'فندق'],
]

const PRICES = [
  ['', 'نطاق السعر'],
  ['3000000', 'حتى 3 مليون'],
  ['6000000', 'حتى 6 مليون'],
  ['10000000', 'حتى 10 مليون'],
  ['20000000', 'حتى 20 مليون'],
]

export default function Home() {
  useTitle('')
  const { t } = useLang()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('properties')
  const [form, setForm] = useState({ q: '', areaId: '', type: '', rooms: '', maxPrice: '' })

  useEffect(() => {
    api.home().then(setData).catch((err) => setError(err.message))
  }, [])

  function submit(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (form.q) params.set('project', form.q)
    if (form.areaId) params.set('areaId', form.areaId)
    if (form.type) params.set('type', form.type)
    if (form.rooms) params.set('rooms', form.rooms)
    if (form.maxPrice) params.set('maxPrice', form.maxPrice)
    // «العقارات» searches the for-sale section; «الوحدات» searches units (or lands when أرض is picked).
    const path = tab === 'properties' ? '/properties' : form.type === 'أرض' ? '/lands' : '/units'
    if (path === '/lands') params.delete('type')
    navigate(`${path}?${params}`)
  }

  const areas = data?.areas || []
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{t('اكتشف سكنك القادم')}</h1>
          <p>{t('شقق، فلل، تاون وتوين هاوس، وأراضٍ في 6 أكتوبر والشيخ زايد وأكتوبر الجديدة. السعر والمساحة ونظام السداد يظهرون عند إدخالهم فقط.')}</p>
        </div>
      </section>
      <div className="container search-overlap">
        <form className="search-card" onSubmit={submit}>
          <div className="tabs" role="tablist">
            <button type="button" className={tab === 'properties' ? 'on' : ''} onClick={() => setTab('properties')}>{t('العقارات')}</button>
            <button type="button" className={tab === 'units' ? 'on' : ''} onClick={() => setTab('units')}>{t('الوحدات')}</button>
          </div>
          <div className="search-fields">
            <input value={form.q} onChange={(event) => setForm({ ...form, q: event.target.value })} placeholder={tab === 'properties' ? t('اكتب كلمة من اسم العقار') : t('المنطقة أو اسم الكمبوند')} />
            <div className="search-row">
              <select value={form.areaId} onChange={(event) => setForm({ ...form, areaId: event.target.value })} aria-label={t('المنطقة')}>
                <option value="">{t('كل المناطق')}</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
              {/* «العقارات» are whole buildings: type and rooms only apply to units. */}
              {tab === 'units' ? (
                <>
                  <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} aria-label={t('نوع العقار')}>
                    <option value="">{t('نوع العقار')}</option>
                    {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{t(type)}</option>)}
                  </select>
                  <select value={form.rooms} onChange={(event) => setForm({ ...form, rooms: event.target.value })} aria-label={t('الغرف')}>
                    <option value="">{t('الغرف')}</option>
                    {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{t(`${count}+ غرف`)}</option>)}
                  </select>
                </>
              ) : null}
              <select value={form.maxPrice} onChange={(event) => setForm({ ...form, maxPrice: event.target.value })} aria-label={t('نطاق السعر')}>
                {PRICES.map(([value, label]) => <option key={label} value={value}>{t(label)}</option>)}
              </select>
              <button className="btn btn-primary" type="submit">{t('بحث')}</button>
            </div>
            <Link className="advanced" to="/search">{t('بحث متقدم')}</Link>
          </div>
        </form>
      </div>

      <section className="section container">
        <div className="section-head"><div><p className="kicker">{t('اختصارات')}</p><h2>{t('بتدور على إيه؟')}</h2></div></div>
        <div className="look-grid">
          {LOOKING.map(([label, value]) => (
            <Link key={label} className="look" to={value === 'أرض' ? '/lands' : `/search?type=${encodeURIComponent(value)}`}>
              <span>{t(label)}</span>
            </Link>
          ))}
        </div>
      </section>

      {error ? <p className="container msg-err">{error}</p> : null}
      {!data ? <p className="container state">{t('جارٍ تحميل العقارات…')}</p> : null}

      {data?.properties?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">{t('للبيع')}</p><h2>{t('عقارات للبيع')}</h2></div><Link to="/properties">{t('كل العقارات')}</Link></div>
          <div className="grid-cards three">{data.properties.map((item) => <ListingCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {data?.latest?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">{t('متاح الآن')}</p><h2>{t('أحدث الوحدات')}</h2></div><Link to="/units">{t('عرض الوحدات')}</Link></div>
          <div className="grid-cards three">{data.latest.map((item) => <ListingCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {data?.lands?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">{t('أراضٍ')}</p><h2>{t('أحدث الأراضي')}</h2></div><Link to="/lands">{t('كل الأراضي')}</Link></div>
          <div className="grid-cards three">{data.lands.map((item) => <ListingCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {data?.offers?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">{t('سداد')}</p><h2>{t('عروض وفرص استثمارية')}</h2></div><Link to="/search?offers=1">{t('كل العروض')}</Link></div>
          <div className="grid-cards three">{data.offers.map((item) => <ListingCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {areas.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">{t('التغطية')}</p><h2>{t('المناطق الأكثر طلبًا')}</h2></div></div>
          <div className="area-rail">
            {areas.map((area) => (
              <Link key={area.id} className="area-card" to={`/search?areaId=${area.id}`}>
                <strong>{area.name}</strong>
                <span>{t(`${area.count} إعلان منشور`)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section container">
        <div className="section-head"><div><p className="kicker">{t('العملاء')}</p><h2>{t('آراء العملاء')}</h2></div></div>
        {data?.testimonials?.length ? (
          <div className="quote-grid">
            {data.testimonials.map((item) => (
              <blockquote className="quote" key={item.id}>
                <p>{item.text}</p>
                <strong>{item.name}</strong>
                {item.place ? <span className="quiet"> {item.place}</span> : null}
              </blockquote>
            ))}
          </div>
        ) : <p className="note">{t('لا ننشر تقييمات جاهزة. يظهر هنا رأي العميل فقط بعد موافقته، ولا توجد آراء منشورة حاليًا.')}</p>}
      </section>

      <section className="section container" id="quick-contact">
        <div className="contact-grid">
          <div>
            <p className="kicker">{t('رسالة سريعة')}</p>
            <h2>{t('تواصل مع بلو هوم')}</h2>
            <p className="quiet">{t('اكتب اسمك ورقم الموبايل وطلبك. الطلب يتحفظ لصاحب المنصة.')}</p>
          </div>
          <div className="panel"><InquiryForm allowViewing={false} /></div>
        </div>
      </section>
    </>
  )
}
