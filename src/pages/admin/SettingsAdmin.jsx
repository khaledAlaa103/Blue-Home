import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useTitle } from '../../format'
import { Field } from './ui'
import { PasswordInput } from '../../components/PasswordInput'

export default function SettingsAdmin() {
  useTitle('الإعدادات')
  const [form, setForm] = useState(null)
  const [password, setPassword] = useState({ current: '', next: '' })
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

  async function changePassword(event) {
    event.preventDefault()
    try {
      await api.changePassword(password.current, password.next)
      setPassword({ current: '', next: '' })
      setMessage('تم تغيير كلمة المرور')
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
        <Field label="نبذة تظهر في من نحن" wide><textarea value={form.about || ''} onChange={(event) => set('about', event.target.value)} /></Field>
        <button className="btn btn-primary" type="submit">حفظ</button>
      </form>
      <form className="panel form-grid" onSubmit={changePassword}>
        <h2 className="wide">تغيير كلمة المرور</h2>
        <Field label="الحالية"><PasswordInput value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} autoComplete="current-password" required /></Field>
        <Field label="الجديدة"><PasswordInput value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} autoComplete="new-password" required /></Field>
        <button className="btn btn-navy" type="submit">تحديث كلمة المرور</button>
      </form>
    </>
  )
}
