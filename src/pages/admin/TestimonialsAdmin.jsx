import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useTitle } from '../../format'
import { Field } from './ui'

const empty = { name: '', place: '', text: '', confirmed: false, published: false }

export default function TestimonialsAdmin() {
  useTitle('آراء العملاء')
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  function load() { api.adminTestimonials().then((data) => setItems(data.items)).catch((err) => setError(err.message)) }
  useEffect(load, [])
  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  async function save(event) {
    event.preventDefault()
    try {
      await api.saveTestimonial(form, form.id)
      setForm(empty)
      setError('')
      load()
    } catch (err) { setError(err.message) }
  }

  return (
    <>
      <h1>آراء العملاء</h1>
      <p className="quiet">لا يُنشر رأي إلا إذا كان حقيقيًا ووافقت على نشره. لا تضع تقييمات جاهزة.</p>
      <form className="panel form-grid" onSubmit={save}>
        <Field label="اسم العميل"><input value={form.name} onChange={(event) => set('name', event.target.value)} required /></Field>
        <Field label="المنطقة أو المشروع"><input value={form.place} onChange={(event) => set('place', event.target.value)} /></Field>
        <Field label="الرأي" wide><textarea value={form.text} onChange={(event) => set('text', event.target.value)} required /></Field>
        <label className="check"><input type="checkbox" checked={form.confirmed} onChange={(event) => set('confirmed', event.target.checked)} /> أؤكد أن الرأي حقيقي وموافق على نشره</label>
        <label className="check"><input type="checkbox" checked={form.published} onChange={(event) => set('published', event.target.checked)} /> نشر في الموقع</label>
        <div className="actions wide">
          <button className="btn btn-primary" type="submit">{form.id ? 'حفظ' : 'إضافة'}</button>
          {form.id ? <button className="btn btn-line" type="button" onClick={() => setForm(empty)}>إلغاء</button> : null}
        </div>
      </form>
      {error ? <p className="msg-err">{error}</p> : null}
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>الاسم</th><th>الرأي</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.text}</td>
                <td>{item.published ? 'منشور' : 'مخفي'}</td>
                <td className="actions">
                  <button className="btn btn-line btn-sm" type="button" onClick={() => setForm(item)}>تعديل</button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={async () => { if (window.confirm('حذف الرأي؟')) { await api.deleteTestimonial(item.id); load() } }}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
