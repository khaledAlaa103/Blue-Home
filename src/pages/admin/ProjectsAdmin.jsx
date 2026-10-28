import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useTitle } from '../../format'
import { Field, ImagesField, LocationField, VideoField } from './ui'

const empty = { name: '', developer: '', areaId: '', address: '', description: '', featuresText: '', lat: '', lng: '', videoUrl: '', virtualTourUrl: '', images: [], published: true, featured: false, isSample: false }

export default function ProjectsAdmin() {
  useTitle('إدارة المشاريع')
  const [items, setItems] = useState([])
  const [areas, setAreas] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  function load() {
    api.adminProjects().then((data) => setItems(data.items)).catch((err) => setError(err.message))
    api.adminAreas().then((data) => setAreas(data.items)).catch(() => {})
  }
  useEffect(load, [])
  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  function edit(item) {
    setForm({ ...item, featuresText: (item.features || []).join('\n'), lat: item.lat ?? '', lng: item.lng ?? '', images: item.images || [] })
    window.scrollTo(0, 0)
  }

  async function save(event) {
    event.preventDefault()
    const body = { ...form, features: form.featuresText.split('\n').map((line) => line.trim()).filter(Boolean), lat: form.lat, lng: form.lng }
    try {
      await api.saveProject(body, form.id)
      setForm(empty)
      setError('')
      load()
    } catch (err) { setError(err.message) }
  }

  async function toggle(item, patch) {
    try { await api.saveProject({ ...item, ...patch }, item.id); load() } catch (err) { setError(err.message) }
  }

  return (
    <>
      <h1>المشاريع</h1>
      <form className="panel form-grid" onSubmit={save}>
        <Field label="اسم المشروع"><input value={form.name} onChange={(event) => set('name', event.target.value)} required /></Field>
        <Field label="الشركة المطورة"><input value={form.developer || ''} onChange={(event) => set('developer', event.target.value)} /></Field>
        <Field label="المنطقة"><select value={form.areaId} onChange={(event) => set('areaId', event.target.value)} required><option value="">اختر</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field>
        <Field label="العنوان"><input value={form.address || ''} onChange={(event) => set('address', event.target.value)} /></Field>
        <Field label="الوصف" wide><textarea value={form.description || ''} onChange={(event) => set('description', event.target.value)} /></Field>
        <Field label="المميزات، سطر لكل ميزة" wide><textarea value={form.featuresText || ''} onChange={(event) => set('featuresText', event.target.value)} /></Field>
        <LocationField lat={form.lat} lng={form.lng} label={form.name} onChange={(lat, lng) => { set('lat', lat); set('lng', lng) }} />
        <VideoField value={form.videoUrl || ''} onChange={(url) => set('videoUrl', url)} />
        <Field label="رابط جولة افتراضية"><input value={form.virtualTourUrl || ''} onChange={(event) => set('virtualTourUrl', event.target.value)} /></Field>
        <ImagesField images={form.images || []} onChange={(images) => set('images', images)} />
        <label className="check"><input type="checkbox" checked={form.published} onChange={(event) => set('published', event.target.checked)} /> ظاهر في الموقع</label>
        <label className="check"><input type="checkbox" checked={form.featured} onChange={(event) => set('featured', event.target.checked)} /> مشروع مميز</label>
        <label className="check"><input type="checkbox" checked={form.isSample} onChange={(event) => set('isSample', event.target.checked)} /> بيانات تجريبية</label>
        <div className="actions wide">
          <button className="btn btn-primary" type="submit">{form.id ? 'حفظ التعديل' : 'إضافة مشروع'}</button>
          {form.id ? <button className="btn btn-line" type="button" onClick={() => setForm(empty)}>إلغاء</button> : null}
        </div>
      </form>
      {error ? <p className="msg-err">{error}</p> : null}
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>المشروع</th><th>المنطقة</th><th>الظهور</th><th></th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}{item.isSample ? ' · تجريبي' : ''}</td>
                <td>{item.areaName}</td>
                <td>{item.published ? 'ظاهر' : 'مخفي'}{item.featured ? ' · مميز' : ''}</td>
                <td className="actions">
                  <button className="btn btn-line btn-sm" type="button" onClick={() => edit(item)}>تعديل</button>
                  <button className="btn btn-line btn-sm" type="button" onClick={() => toggle(item, { published: !item.published })}>{item.published ? 'إخفاء' : 'إظهار'}</button>
                  <button className="btn btn-line btn-sm" type="button" onClick={() => toggle(item, { featured: !item.featured })}>مميز</button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={async () => { if (window.confirm(`حذف ${item.name}؟ سيتم فك ارتباط إعلاناته.`)) { await api.deleteProject(item.id); load() } }}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
