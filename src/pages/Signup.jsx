import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'
import { PasswordInput } from '../components/PasswordInput'
import { useTitle } from '../format'

const EMPTY = { firstName: '', lastName: '', phone: '', username: '', password: '', confirmPassword: '', address: '' }

export default function Signup() {
  useTitle('Sign up')
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
      setError('تأكيد كلمة المرور غير مطابق')
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
      <form className="login-panel" onSubmit={submit}>
        <h1>Sign up</h1>
        <p className="quiet">أنشئ حسابًا جديدًا على بلو هوم.</p>
        <label className="field"><span>الاسم الأول</span><input value={form.firstName} onChange={set('firstName')} autoComplete="given-name" required /></label>
        <label className="field"><span>الاسم الثاني</span><input value={form.lastName} onChange={set('lastName')} autoComplete="family-name" required /></label>
        <label className="field"><span>رقم التليفون</span><input value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" required /></label>
        <label className="field"><span>Username</span><input value={form.username} onChange={set('username')} autoComplete="username" required /></label>
        <label className="field"><span>Password</span><PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" required /></label>
        <label className="field"><span>Confirm password</span><PasswordInput value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" required /></label>
        <label className="field"><span>العنوان</span><input value={form.address} onChange={set('address')} autoComplete="street-address" required /></label>
        {error ? <p className="msg-err">{error}</p> : null}
        <button className="btn btn-primary" disabled={pending} type="submit">{pending ? 'جارٍ إنشاء الحساب…' : 'Sign up'}</button>
        <p className="quiet">لديك حساب؟ <Link to="/login">Login</Link></p>
      </form>
    </main>
  )
}
