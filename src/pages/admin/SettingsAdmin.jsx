import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useTitle } from '../../format'
import { Field } from './ui'

export default function SettingsAdmin() {
  useTitle('الإعدادات')
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { api.bootstrap().then((data) => setForm(data.settings)).catch((err) => setError(err.message)) }, [])
  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  async function save(event) {
    event.preventDefault()
    try {
      const saved = await api.saveSettings(form)
      setForm(saved)
      setMessage('تم حفظ بيانات التواصل')
      setError('')
    } catch (err) { setError(err.message); setMessage('') }
  }

  if (!form) return <p className="state">جارٍ التحميل…</p>
  return (
    <>
      <h1>إعدادات الموقع</h1>
      {message ? <p className="msg-ok">{message}</p> : null}
      {error ? <p className="msg-err">{error}</p> : null}
      <form className="panel form-grid" onSubmit={save}>
        <Field label="اسم الموقع"><input value={form.siteName || ''} onChange={(event) => set('siteName', event.target.value)} /></Field>
        <Field label="الاسم بالإنجليزية"><input value={form.siteNameEn || ''} onChange={(event) => set('siteNameEn', event.target.value)} /></Field>
        <Field label="الهاتف"><input className="num" value={form.phone || ''} onChange={(event) => set('phone', event.target.value)} /></Field>
        <Field label="واتساب (اختياري)"><input className="num" value={form.whatsapp || ''} onChange={(event) => set('whatsapp', event.target.value)} placeholder="فاضي = نفس رقم الهاتف" /></Field>
        <p className="quiet wide">رقم الهاتف بيظهر للاتصال وللواتساب مع بعض. اكتب رقم واتساب بس لو عايزه مختلف عن الهاتف.</p>
        <Field label="البريد"><input value={form.email || ''} onChange={(event) => set('email', event.target.value)} /></Field>
        <Field label="العنوان"><input value={form.address || ''} onChange={(event) => set('address', event.target.value)} /></Field>
        <Field label="فيسبوك"><input value={form.facebook || ''} onChange={(event) => set('facebook', event.target.value)} placeholder="https://" /></Field>
        <Field label="إنستغرام"><input value={form.instagram || ''} onChange={(event) => set('instagram', event.target.value)} placeholder="https://" /></Field>
        <Field label="يوتيوب"><input value={form.youtube || ''} onChange={(event) => set('youtube', event.target.value)} placeholder="https://" /></Field>
        <Field label="صفحة من نحن" wide><textarea className="about-input" value={form.about || ''} onChange={(event) => set('about', event.target.value)} maxLength={5000} placeholder="اكتب الكلام اللي يظهر في صفحة من نحن" /></Field>
        <p className="quiet wide">الكلام ده بس اللي بيظهر في صفحة من نحن. كل سطر جديد بيبقى فقرة لوحده.</p>
        <button className="btn btn-primary" type="submit">حفظ</button>
      </form>
    </>
  )
}
