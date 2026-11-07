import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'
import { PasswordInput } from '../components/PasswordInput'
import { useTitle } from '../format'
import { useLang } from '../i18n'
import { latinDigits } from '../../shared/constants.js'

const EMPTY = { firstName: '', lastName: '', phone: '', username: '', password: '', confirmPassword: '', address: '' }

export default function Signup() {
  const { t } = useLang()
  useTitle('إنشاء حساب')
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  function set(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError(t('تأكيد كلمة المرور غير مطابق'))
      return
    }
    setPending(true)
    try {
      const result = await api.register(form)
      setToken(result.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-screen">
      <div className="login-hero">
        <strong>{t('انضم إلى بلو هوم')}</strong>
        <span>{t('أنشئ حسابك المجاني واطّلع على الأسعار الكاملة')}</span>
      </div>
      <form className="login-panel" onSubmit={submit}>
        <h1>{t('إنشاء حساب')}</h1>
        <p className="quiet">{t('أنشئ حسابًا جديدًا على بلو هوم.')}</p>
        <label className="field"><span>{t('الاسم الأول')}</span><input value={form.firstName} onChange={set('firstName')} autoComplete="given-name" required /></label>
        <label className="field"><span>{t('الاسم الثاني')}</span><input value={form.lastName} onChange={set('lastName')} autoComplete="family-name" required /></label>
        <label className="field"><span>{t('رقم التليفون')}</span><input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: latinDigits(event.target.value) }))} autoComplete="tel" inputMode="tel" required /></label>
        <label className="field"><span>{t('اسم المستخدم')}</span><input value={form.username} onChange={set('username')} autoComplete="username" required /></label>
        <label className="field"><span>{t('كلمة المرور')}</span><PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" required /></label>
        <label className="field"><span>{t('تأكيد كلمة المرور')}</span><PasswordInput value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" required /></label>
        <label className="field"><span>{t('العنوان')}</span><input value={form.address} onChange={set('address')} autoComplete="street-address" required /></label>
        {error ? <p className="msg-err">{error}</p> : null}
        <button className="btn btn-primary" disabled={pending} type="submit">{pending ? t('جارٍ إنشاء الحساب…') : t('إنشاء حساب')}</button>
        <p className="quiet">{t('لديك حساب؟')} <Link to="/login">{t('تسجيل الدخول')}</Link></p>
      </form>
    </main>
  )
}
