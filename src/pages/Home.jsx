import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ListingCard } from '../components/Cards'
import { InquiryForm } from '../components/InquiryForm'
import { useTitle } from '../format'
import { PROPERTY_TYPES } from '../../shared/constants.js'

const LOOKING = [
  ['شقق', 'شقة'],
  ['فلل', 'فيلا'],
  ['تاون', 'تاون هاوس'],
  ['توين', 'توين هاوس'],
  ['أراضي', 'أرض'],
  ['محلات', 'محل تجاري'],
  ['إداري', 'إداري'],
  ['عروض', 'offers'],
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
          <h1>اكتشف سكنك القادم</h1>
          <p>شقق، فلل، تاون وتوين هاوس، وأراضٍ في 6 أكتوبر والشيخ زايد وأكتوبر الجديدة. السعر والمساحة ونظام السداد يظهرون عند إدخالهم فقط.</p>
        </div>
      </section>
      <div className="container search-overlap">
        <form className="search-card" onSubmit={submit}>
          <div className="tabs" role="tablist">
            <button type="button" className={tab === 'properties' ? 'on' : ''} onClick={() => setTab('properties')}>العقارات</button>
            <button type="button" className={tab === 'units' ? 'on' : ''} onClick={() => setTab('units')}>الوحدات</button>
          </div>
          <div className="search-fields">
            <input value={form.q} onChange={(event) => setForm({ ...form, q: event.target.value })} placeholder={tab === 'properties' ? 'اكتب كلمة من اسم العقار' : 'المنطقة أو اسم الكمبوند'} />
            <div className="search-row">
              <select value={form.areaId} onChange={(event) => setForm({ ...form, areaId: event.target.value })} aria-label="المنطقة">
                <option value="">كل المناطق</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
              {/* «العقارات» are whole buildings: type and rooms only apply to units. */}
              {tab === 'units' ? (
                <>
                  <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} aria-label="نوع العقار">
                    <option value="">نوع العقار</option>
                    {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <select value={form.rooms} onChange={(event) => setForm({ ...form, rooms: event.target.value })} aria-label="الغرف">
                    <option value="">الغرف</option>
                    {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}+ غرف</option>)}
                  </select>
                </>
              ) : null}
              <select value={form.maxPrice} onChange={(event) => setForm({ ...form, maxPrice: event.target.value })} aria-label="نطاق السعر">
                {PRICES.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
              </select>
              <button className="btn btn-primary" type="submit">بحث</button>
            </div>
            <Link className="advanced" to="/search">بحث متقدم</Link>
          </div>
        </form>
      </div>

      <section className="section container">
        <div className="section-head"><div><p className="kicker">اختصارات</p><h2>بتدور على إيه؟</h2></div></div>
        <div className="look-grid">
          {LOOKING.map(([label, value]) => (
            <Link key={label} className="look" to={value === 'offers' ? '/search?offers=1' : value === 'أرض' ? '/lands' : `/search?type=${encodeURIComponent(value)}`}>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {error ? <p className="container msg-err">{error}</p> : null}
      {!data ? <p className="container state">جارٍ تحميل العقارات…</p> : null}

      {data?.properties?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">للبيع</p><h2>عقارات للبيع</h2></div><Link to="/properties">كل العقارات</Link></div>
          <div className="grid-cards three">{data.properties.map((item) => <ListingCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {data?.latest?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">متاح الآن</p><h2>أحدث الوحدات</h2></div><Link to="/units">عرض الوحدات</Link></div>
          <div className="grid-cards three">{data.latest.map((item) => <ListingCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {data?.lands?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">أراضٍ</p><h2>أحدث الأراضي</h2></div><Link to="/lands">كل الأراضي</Link></div>
          <div className="grid-cards three">{data.lands.map((item) => <ListingCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {data?.offers?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">سداد</p><h2>عروض وفرص استثمارية</h2></div><Link to="/search?offers=1">كل العروض</Link></div>
          <div className="grid-cards three">{data.offers.map((item) => <ListingCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {areas.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">التغطية</p><h2>المناطق الأكثر طلبًا</h2></div></div>
          <div className="area-rail">
            {areas.map((area) => (
              <Link key={area.id} className="area-card" to={`/search?areaId=${area.id}`}>
                <strong>{area.name}</strong>
                <span>{area.count} إعلان منشور</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section container">
        <div className="section-head"><div><p className="kicker">العملاء</p><h2>آراء العملاء</h2></div></div>
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
        ) : <p className="note">لا ننشر تقييمات جاهزة. يظهر هنا رأي العميل فقط بعد موافقته، ولا توجد آراء منشورة حاليًا.</p>}
      </section>

      <section className="section container" id="quick-contact">
        <div className="contact-grid">
          <div>
            <p className="kicker">رسالة سريعة</p>
            <h2>تواصل مع بلو هوم</h2>
            <p className="quiet">اكتب اسمك ورقم الموبايل وطلبك. الطلب يتحفظ لصاحب المنصة.</p>
          </div>
          <div className="panel"><InquiryForm allowViewing={false} /></div>
        </div>
      </section>
    </>
  )
}
