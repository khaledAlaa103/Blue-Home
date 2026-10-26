import { useState } from 'react'
import { api } from '../api'
import { REQUEST_TYPES } from '../../shared/constants.js'

export function InquiryForm({ listingId = '', projectId = '', allowViewing = true }) {
  const options = REQUEST_TYPES.filter((item) => allowViewing || item.id !== 'viewing')
  const [form, setForm] = useState({ name: '', phone: '', message: '', requestType: allowViewing ? 'viewing' : 'details', company: '' })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await api.inquire({ ...form, listingId, projectId })
      setStatus('تم استلام طلبك. سيظهر لصاحب المنصة في لوحة التحكم.')
      setForm({ name: '', phone: '', message: '', requestType: form.requestType, company: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  if (status) return <p className="msg-ok">{status}</p>
  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="hp" aria-hidden="true"><input tabIndex={-1} autoComplete="off" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></div>
      <label className="field"><span>الاسم</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
      <label className="field"><span>الموبايل</span><input className="num" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></label>
      <label className="field"><span>نوع الطلب</span>
        <select value={form.requestType} onChange={(event) => setForm({ ...form, requestType: event.target.value })}>
          {options.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="field"><span>الرسالة</span><textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required /></label>
      {error ? <p className="msg-err">{error}</p> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">{pending ? 'جارٍ الإرسال…' : 'إرسال الطلب'}</button>
    </form>
  )
}
