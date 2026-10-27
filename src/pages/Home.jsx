import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ListingCard, ProjectCard } from '../components/Cards'
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
  const [tab, setTab] = useState('units')
  const [form, setForm] = useState({ q: '', areaId: '', type: '', rooms: '', maxPrice: '' })

  useEffect(() => {
    api.home().then(setData).catch((err) => setError(err.message))
  }, [])

  function submit(event) {
    event.preventDefault()
    if (tab === 'projects') {
      const params = new URLSearchParams()
      if (form.q) params.set('q', form.q)
      if (form.areaId) params.set('areaId', form.areaId)
      navigate(`/projects?${params}`)
      return
    }
    const params = new URLSearchParams()
    if (form.q) params.set('project', form.q)
    if (form.areaId) params.set('areaId', form.areaId)
    if (form.type) params.set('type', form.type)
    if (form.rooms) params.set('rooms', form.rooms)
    if (form.maxPrice) params.set('maxPrice', form.maxPrice)
    const path = form.type === 'أرض' ? '/lands' : '/search'
    if (form.type === 'أرض') params.delete('type')
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
            <button type="button" className={tab === 'projects' ? 'on' : ''} onClick={() => setTab('projects')}>المشاريع</button>
            <button type="button" className={tab === 'units' ? 'on' : ''} onClick={() => setTab('units')}>العقارات</button>
          </div>
          <div className="search-fields">
            <input value={form.q} onChange={(event) => setForm({ ...form, q: event.target.value })} placeholder={tab === 'projects' ? 'اسم المشروع أو المطور' : 'المنطقة أو اسم الكمبوند'} />
            <div className="search-row">
              <select value={form.areaId} onChange={(event) => setForm({ ...form, areaId: event.target.value })} aria-label="المنطقة">
                <option value="">كل المناطق</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
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
                  <select value={form.maxPrice} onChange={(event) => setForm({ ...form, maxPrice: event.target.value })} aria-label="نطاق السعر">
                    {PRICES.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
                  </select>
                </>
              ) : null}
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

      {data?.projects?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">كمبوندات</p><h2>مشاريع مميزة</h2></div><Link to="/projects">كل المشاريع</Link></div>
          <div className="feature-grid">
            <ProjectCard item={data.projects[0]} />
            <div className="stack-form">{data.projects.slice(1).map((item) => <ProjectCard key={item.id} item={item} />)}</div>
          </div>
        </section>
      ) : null}

      {data?.latest?.length ? (
        <section className="section container">
          <div className="section-head"><div><p className="kicker">متاح الآن</p><h2>أحدث العقارات</h2></div><Link to="/units">عرض الوحدات</Link></div>
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
        <div className="section-head"><div><p className="kicker">الطريقة</p><h2>لماذا بلو هوم؟</h2></div></div>
        <div className="why-grid">
          <article className="why"><b>البيانات كما أُدخلت</b><p className="quiet">الخانة الفاضية لا تُملأ برقم تقريبي أو ميزة غير مكتوبة.</p></article>
          <article className="why"><b>بحث يشتغل على الإعلانات</b><p className="quiet">المنطقة والسعر والمساحة والغرف ونظام السداد بتفلتر النتائج الفعلية.</p></article>
          <article className="why"><b>غرب القاهرة، ومناطق إضافية</b><p className="quiet">6 أكتوبر والشيخ زايد وأكتوبر الجديدة، مع إمكانية إضافة منطقة من لوحة التحكم.</p></article>
          <article className="why"><b>تواصل مباشر</b><p className="quiet">طلب المعاينة يصل لصاحب المنصة، والاتصال وواتساب يظهران بعد إضافة الرقم.</p></article>
        </div>
      </section>

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
