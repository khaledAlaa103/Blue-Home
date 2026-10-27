import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { formatPrice, statusLabel, useTitle } from '../../format'
import { OPERATIONS, PAYMENTS, PROPERTY_TYPES, ROOM_TYPES, STATUSES } from '../../../shared/constants.js'
import { emptyToNull, Field, ImagesField, VideoField } from './ui'

const empty = { title: '', description: '', type: 'شقة', operation: 'sale', areaId: '', projectId: '', address: '', price: '', areaSqm: '', rooms: '', baths: '', paymentType: 'cash', downPayment: '', installmentAmount: '', installmentMonths: '', paymentNote: '', status: 'available', lat: '', lng: '', videoUrl: '', virtualTourUrl: '', featuresText: '', images: [], published: true, featured: false, isOffer: false, isSample: false }

export default function ListingsAdmin() {
  useTitle('إدارة الإعلانات')
  const [items, setItems] = useState([])
  const [areas, setAreas] = useState([])
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  function load() {
    api.adminListings().then((data) => setItems(data.items)).catch((err) => setError(err.message))
    api.adminAreas().then((data) => setAreas(data.items)).catch(() => {})
    api.adminProjects().then((data) => setProjects(data.items)).catch(() => {})
  }
  useEffect(load, [])
  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }
  const showRooms = ROOM_TYPES.includes(form.type)

  function edit(item) {
    setForm({
      ...empty,
      ...item,
      price: item.price ?? '',
      areaSqm: item.areaSqm ?? '',
      rooms: item.rooms ?? '',
      baths: item.baths ?? '',
      downPayment: item.downPayment ?? '',
      installmentAmount: item.installmentAmount ?? '',
      installmentMonths: item.installmentMonths ?? '',
      lat: item.lat ?? '',
      lng: item.lng ?? '',
      projectId: item.projectId || '',
      featuresText: (item.features || []).join('\n'),
      images: item.images || [],
    })
    window.scrollTo(0, 0)
  }

  async function save(event) {
    event.preventDefault()
    const body = {
      ...form,
      price: emptyToNull(form.price),
      areaSqm: emptyToNull(form.areaSqm),
      rooms: emptyToNull(form.rooms),
      baths: emptyToNull(form.baths),
      downPayment: emptyToNull(form.downPayment),
      installmentAmount: emptyToNull(form.installmentAmount),
      installmentMonths: emptyToNull(form.installmentMonths),
      lat: emptyToNull(form.lat),
      lng: emptyToNull(form.lng),
      features: form.featuresText.split('\n').map((line) => line.trim()).filter(Boolean),
    }
    try {
      await api.saveListing(body, form.id)
      setForm(empty)
      setError('')
      load()
    } catch (err) { setError(err.message) }
  }

  async function toggle(item, patch) {
    try { await api.saveListing({ ...item, ...patch }, item.id); load() } catch (err) { setError(err.message) }
  }

  return (
    <>
      <h1>الإعلانات</h1>
      <form className="panel form-grid" onSubmit={save}>
        <Field label="عنوان الإعلان" wide><input value={form.title} onChange={(event) => set('title', event.target.value)} required /></Field>
        <Field label="نوع العقار"><select value={form.type} onChange={(event) => set('type', event.target.value)}>{PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
        <Field label="العملية"><select value={form.operation} onChange={(event) => set('operation', event.target.value)}>{OPERATIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
        <Field label="المنطقة"><select value={form.areaId} onChange={(event) => set('areaId', event.target.value)} required><option value="">اختر</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field>
        <Field label="المشروع"><select value={form.projectId} onChange={(event) => { const project = projects.find((item) => item.id === event.target.value); setForm((current) => ({ ...current, projectId: event.target.value, areaId: project?.areaId || current.areaId })) }}><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
        <Field label="العنوان" wide><input value={form.address || ''} onChange={(event) => set('address', event.target.value)} /></Field>
        <Field label="الوصف" wide><textarea value={form.description || ''} onChange={(event) => set('description', event.target.value)} /></Field>
        <Field label="السعر بالجنيه"><input className="num" value={form.price} onChange={(event) => set('price', event.target.value)} /></Field>
        <Field label="المساحة م²"><input className="num" value={form.areaSqm} onChange={(event) => set('areaSqm', event.target.value)} /></Field>
        {showRooms ? <Field label="الغرف"><input className="num" value={form.rooms} onChange={(event) => set('rooms', event.target.value)} /></Field> : null}
        {showRooms ? <Field label="الحمامات"><input className="num" value={form.baths} onChange={(event) => set('baths', event.target.value)} /></Field> : null}
        <Field label="نظام السداد"><select value={form.paymentType} onChange={(event) => set('paymentType', event.target.value)}>{PAYMENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
        <Field label="الحالة"><select value={form.status} onChange={(event) => set('status', event.target.value)}>{STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
        <Field label="المقدم"><input className="num" value={form.downPayment} onChange={(event) => set('downPayment', event.target.value)} /></Field>
        <Field label="قيمة القسط"><input className="num" value={form.installmentAmount} onChange={(event) => set('installmentAmount', event.target.value)} /></Field>
        <Field label="مدة التقسيط بالأشهر"><input className="num" value={form.installmentMonths} onChange={(event) => set('installmentMonths', event.target.value)} /></Field>
        <Field label="ملاحظة السداد"><input value={form.paymentNote || ''} onChange={(event) => set('paymentNote', event.target.value)} /></Field>
        <Field label="خط العرض"><input className="num" value={form.lat} onChange={(event) => set('lat', event.target.value)} /></Field>
        <Field label="خط الطول"><input className="num" value={form.lng} onChange={(event) => set('lng', event.target.value)} /></Field>
        <VideoField value={form.videoUrl || ''} onChange={(url) => set('videoUrl', url)} />
        <Field label="جولة افتراضية"><input value={form.virtualTourUrl || ''} onChange={(event) => set('virtualTourUrl', event.target.value)} /></Field>
        <Field label="المميزات، سطر لكل ميزة" wide><textarea value={form.featuresText || ''} onChange={(event) => set('featuresText', event.target.value)} /></Field>
        <ImagesField images={form.images || []} onChange={(images) => set('images', images)} />
        <label className="check"><input type="checkbox" checked={form.published} onChange={(event) => set('published', event.target.checked)} /> ظاهر</label>
        <label className="check"><input type="checkbox" checked={form.featured} onChange={(event) => set('featured', event.target.checked)} /> مميز</label>
        <label className="check"><input type="checkbox" checked={form.isOffer} onChange={(event) => set('isOffer', event.target.checked)} /> ضمن العروض</label>
        <label className="check"><input type="checkbox" checked={form.isSample} onChange={(event) => set('isSample', event.target.checked)} /> تجريبي</label>
        <div className="actions wide">
          <button className="btn btn-primary" type="submit">{form.id ? 'حفظ التعديل' : 'إضافة إعلان'}</button>
          {form.id ? <button className="btn btn-line" type="button" onClick={() => setForm(empty)}>إلغاء</button> : null}
        </div>
      </form>
      {error ? <p className="msg-err">{error}</p> : null}
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>الإعلان</th><th>النوع</th><th>السعر</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.type} · {item.areaName}</td>
                <td>{item.price != null ? formatPrice(item.price) : '—'}</td>
                <td>{statusLabel(item.status)} · {item.published ? 'ظاهر' : 'مخفي'}</td>
                <td className="actions">
                  <button className="btn btn-line btn-sm" type="button" onClick={() => edit(item)}>تعديل</button>
                  <button className="btn btn-line btn-sm" type="button" onClick={() => toggle(item, { published: !item.published })}>{item.published ? 'إخفاء' : 'إظهار'}</button>
                  <Link className="btn btn-line btn-sm" to={`/property/${item.id}?preview=1`}>معاينة</Link>
                  <button className="btn btn-danger btn-sm" type="button" onClick={async () => { if (window.confirm(`حذف «${item.title}»؟`)) { await api.deleteListing(item.id); load() } }}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
