import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { formatNumber, formatPrice, statusLabel, useTitle } from '../../format'
import { BUILDING_TYPE, DELIVERIES, FINISHINGS, LEGAL_STATES, PAYMENTS, latinDigits } from '../../../shared/constants.js'
import { emptyToNull, Field, ImagesField, LocationField, VideoField } from './ui'

const SALE_STATUSES = [
  { id: 'available', label: 'متاح للبيع' },
  { id: 'reserved', label: 'محجوز' },
  { id: 'sold', label: 'تم البيع' },
]

const empty = {
  section: 'properties', operation: 'sale', type: BUILDING_TYPE, title: '', description: '', areaId: '', address: '',
  areaSqm: '', floorsCount: '', unitsCount: '', finishing: '', delivery: '', deliveryNote: '', legal: '', featuresText: '',
  price: '', negotiable: false, paymentType: 'cash', downPayment: '', installmentAmount: '', installmentMonths: '', paymentNote: '',
  images: [], videoUrl: '', virtualTourUrl: '', lat: '', lng: '',
  status: 'available', published: true, featured: false, isOffer: false,
}

// Numbers typed with Arabic digits or thousands separators are kept as plain digits.
const digitsOnly = (value) => latinDigits(value).replace(/[^\d.]/g, '')

function Section({ title, hint, children }) {
  return (
    <fieldset className="sale-section wide">
      <legend>{title}</legend>
      {hint ? <p className="quiet">{hint}</p> : null}
      <div className="form-grid">{children}</div>
    </fieldset>
  )
}

// «العقارات»: whole buildings the owner sells. Stored as listings in their own section, always for sale.
export default function PropertiesAdmin() {
  useTitle('العقارات للبيع')
  const [all, setAll] = useState([])
  const [areas, setAreas] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const items = all.filter((item) => item.section === 'properties')

  function load() {
    api.adminListings().then((data) => setAll(data.items)).catch((err) => setError(err.message))
    api.adminAreas().then((data) => setAreas(data.items)).catch(() => {})
  }
  useEffect(load, [])
  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }
  const num = (key) => (event) => set(key, digitsOnly(event.target.value))

  const installments = form.paymentType !== 'cash'
  const perMeter = Number(form.price) && Number(form.areaSqm) ? Math.round(Number(form.price) / Number(form.areaSqm)) : null

  function edit(item) {
    const blankIfNull = (value) => value ?? ''
    setForm({
      ...empty,
      ...item,
      price: blankIfNull(item.price),
      areaSqm: blankIfNull(item.areaSqm),
      floorsCount: blankIfNull(item.floorsCount),
      unitsCount: blankIfNull(item.unitsCount),
      downPayment: blankIfNull(item.downPayment),
      installmentAmount: blankIfNull(item.installmentAmount),
      installmentMonths: blankIfNull(item.installmentMonths),
      lat: blankIfNull(item.lat),
      lng: blankIfNull(item.lng),
      featuresText: (item.features || []).join('\n'),
      images: item.images || [],
    })
    setSaved('')
    window.scrollTo(0, 0)
  }

  async function save(event) {
    event.preventDefault()
    const body = {
      ...form,
      price: emptyToNull(form.price),
      areaSqm: emptyToNull(form.areaSqm),
      floorsCount: emptyToNull(form.floorsCount),
      unitsCount: emptyToNull(form.unitsCount),
      downPayment: installments ? emptyToNull(form.downPayment) : null,
      installmentAmount: installments ? emptyToNull(form.installmentAmount) : null,
      installmentMonths: installments ? emptyToNull(form.installmentMonths) : null,
      deliveryNote: form.delivery === 'construction' ? form.deliveryNote : '',
      lat: emptyToNull(form.lat),
      lng: emptyToNull(form.lng),
      features: form.featuresText.split('\n').map((line) => line.trim()).filter(Boolean),
    }
    try {
      await api.saveListing(body, form.id)
      setSaved(form.id ? 'تم حفظ التعديل.' : 'تم نشر العقار.')
      setForm(empty)
      setError('')
      load()
      window.scrollTo(0, 0)
    } catch (err) { setError(err.message) }
  }

  async function toggle(item, patch) {
    try { await api.saveListing({ ...item, ...patch }, item.id); load() } catch (err) { setError(err.message) }
  }

  return (
    <>
      <div className="dash-title">
        <div><p className="kicker">بيع</p><h1>العقارات للبيع</h1></div>
        <Link className="btn btn-line" to="/properties" target="_blank">صفحة العقارات على الموقع</Link>
      </div>
      <p className="quiet">كل عقار تضيفه هنا بيتعرض للبيع في صفحة «العقارات» على الموقع.</p>
      {saved ? <p className="msg-ok">{saved}</p> : null}

      <form className="panel sale-form" onSubmit={save}>
        <h2 className="sale-form-title">{form.id ? `تعديل: ${form.title}` : 'إضافة عقار للبيع'}</h2>

        <Section title="بيانات العقار">
          <Field label="عنوان العقار" wide><input value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="مثال: عقار 5 أدوار للبيع في الشيخ زايد" required /></Field>
          <Field label="المنطقة"><select value={form.areaId} onChange={(event) => set('areaId', event.target.value)} required><option value="">اختر المنطقة</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field>
          <Field label="العنوان بالتفصيل" wide><input value={form.address || ''} onChange={(event) => set('address', event.target.value)} placeholder="الحي، المجاورة، اسم الكمبوند أو الشارع" /></Field>
          <Field label="وصف العقار" wide><textarea rows={5} value={form.description || ''} onChange={(event) => set('description', event.target.value)} placeholder="اكتب أهم ما يميز العقار: عدد الشقق والمحلات، الإطلالة، القرب من الخدمات، حالة المبنى…" /></Field>
        </Section>

        <Section title="المواصفات">
          <Field label="مساحة الأرض (م²)"><input className="num" inputMode="decimal" value={form.areaSqm} onChange={num('areaSqm')} /></Field>
          <Field label="عدد الأدوار"><input className="num" inputMode="numeric" value={form.floorsCount} onChange={num('floorsCount')} placeholder="مثال: 5" /></Field>
          <Field label="عدد الوحدات (شقق ومحلات)"><input className="num" inputMode="numeric" value={form.unitsCount} onChange={num('unitsCount')} placeholder="مثال: 10" /></Field>
          <Field label="التشطيب"><select value={form.finishing || ''} onChange={(event) => set('finishing', event.target.value)}><option value="">غير محدد</option>{FINISHINGS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
          <Field label="الاستلام"><select value={form.delivery || ''} onChange={(event) => set('delivery', event.target.value)}><option value="">غير محدد</option>{DELIVERIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
          {form.delivery === 'construction' ? <Field label="موعد الاستلام"><input value={form.deliveryNote || ''} onChange={(event) => set('deliveryNote', event.target.value)} placeholder="مثال: ديسمبر 2027" /></Field> : null}
          <Field label="الوضع القانوني"><select value={form.legal || ''} onChange={(event) => set('legal', event.target.value)}><option value="">غير محدد</option>{LEGAL_STATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
          <Field label="المميزات (سطر لكل ميزة)" wide><textarea rows={4} value={form.featuresText || ''} onChange={(event) => set('featuresText', event.target.value)} placeholder={'ناصية\nجراج\nأسانسير\nقريب من المحور'} /></Field>
        </Section>

        <Section title="السعر ونظام السداد">
          <Field label="سعر البيع (جنيه)">
            <input className="num" inputMode="numeric" value={form.price} onChange={num('price')} placeholder="مثال: 4500000" />
          </Field>
          <div className="sale-price-note">
            {form.price ? <strong>{formatPrice(form.price)}</strong> : <span className="quiet">اكتب السعر بالأرقام</span>}
            {perMeter ? <span className="quiet">سعر المتر: {formatNumber(perMeter)} ج.م</span> : null}
          </div>
          <label className="check wide"><input type="checkbox" checked={Boolean(form.negotiable)} onChange={(event) => set('negotiable', event.target.checked)} /> السعر قابل للتفاوض</label>
          <Field label="نظام السداد"><select value={form.paymentType} onChange={(event) => set('paymentType', event.target.value)}>{PAYMENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
          {installments ? (
            <>
              <Field label="المقدم (جنيه)"><input className="num" inputMode="numeric" value={form.downPayment} onChange={num('downPayment')} /></Field>
              <Field label="القسط الشهري (جنيه)"><input className="num" inputMode="numeric" value={form.installmentAmount} onChange={num('installmentAmount')} /></Field>
              <Field label="مدة التقسيط (شهر)"><input className="num" inputMode="numeric" value={form.installmentMonths} onChange={num('installmentMonths')} /></Field>
            </>
          ) : null}
          <Field label="ملاحظة على السداد" wide><input value={form.paymentNote || ''} onChange={(event) => set('paymentNote', event.target.value)} placeholder="مثال: خصم 10% للكاش" /></Field>
        </Section>

        <Section title="الصور والفيديو" hint="أول صورة هي صورة الغلاف اللي بتظهر في الكارت.">
          <ImagesField images={form.images || []} onChange={(images) => set('images', images)} />
          <VideoField value={form.videoUrl || ''} onChange={(url) => set('videoUrl', url)} />
          <Field label="رابط جولة افتراضية (اختياري)" wide><input value={form.virtualTourUrl || ''} onChange={(event) => set('virtualTourUrl', event.target.value)} placeholder="https://…" dir="ltr" /></Field>
        </Section>

        <Section title="المكان على الخريطة">
          <LocationField lat={form.lat} lng={form.lng} label={BUILDING_TYPE} onChange={(lat, lng) => { set('lat', lat); set('lng', lng) }} />
        </Section>

        <Section title="حالة البيع والنشر">
          <Field label="حالة البيع"><select value={form.status} onChange={(event) => set('status', event.target.value)}>{SALE_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
          <div className="sale-checks wide">
            <label className="check"><input type="checkbox" checked={form.published} onChange={(event) => set('published', event.target.checked)} /> ظاهر على الموقع</label>
            <label className="check"><input type="checkbox" checked={form.featured} onChange={(event) => set('featured', event.target.checked)} /> عقار مميز</label>
            <label className="check"><input type="checkbox" checked={form.isOffer} onChange={(event) => set('isOffer', event.target.checked)} /> عرض خاص</label>
          </div>
        </Section>

        {error ? <p className="msg-err">{error}</p> : null}
        <div className="actions sale-actions">
          <button className="btn btn-primary" type="submit">{form.id ? 'حفظ التعديل' : 'نشر العقار'}</button>
          {form.id ? <button className="btn btn-line" type="button" onClick={() => setForm(empty)}>إلغاء التعديل</button> : null}
        </div>
      </form>

      <div className="panel table-wrap">
        <h2>العقارات المعروضة ({items.length})</h2>
        {items.length ? (
          <table>
            <thead><tr><th>العقار</th><th>المنطقة</th><th>سعر البيع</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.areaName}</td>
                  <td>{item.price != null ? formatPrice(item.price) : '—'}{item.negotiable ? ' · قابل للتفاوض' : ''}</td>
                  <td>{item.status === 'sold' ? 'تم البيع' : statusLabel(item.status)} · {item.published ? 'ظاهر' : 'مخفي'}</td>
                  <td className="actions">
                    <button className="btn btn-line btn-sm" type="button" onClick={() => edit(item)}>تعديل</button>
                    {item.status !== 'sold' ? <button className="btn btn-line btn-sm" type="button" onClick={() => { if (window.confirm(`تأكيد إن «${item.title}» اتباع؟`)) toggle(item, { status: 'sold' }) }}>تم البيع</button> : null}
                    <button className="btn btn-line btn-sm" type="button" onClick={() => toggle(item, { published: !item.published })}>{item.published ? 'إخفاء' : 'إظهار'}</button>
                    <Link className="btn btn-line btn-sm" to={`/property/${item.id}?preview=1`}>معاينة</Link>
                    <button className="btn btn-danger btn-sm" type="button" onClick={async () => { if (window.confirm(`حذف «${item.title}»؟`)) { await api.deleteListing(item.id); load() } }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty">لسه مفيش عقارات. ضيف أول عقار من الفورم اللي فوق.</p>}
      </div>
    </>
  )
}
