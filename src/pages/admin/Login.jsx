import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../../api'
import { UserIcon } from '../../components/AccountMenu'
import { PasswordInput } from '../../components/PasswordInput'
import { useTitle } from '../../format'

export default function Login() {
  useTitle('Login')
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const result = await api.login(username, password)
      setToken(result.token)
      navigate(result.user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-screen">
      <div className="login-hero">
        <strong>أهلاً بعودتك</strong>
        <span>سجّل دخولك لمتابعة العقارات والأسعار</span>
      </div>
      <form className="login-panel" onSubmit={submit}>
        <span className="user-badge" aria-hidden="true"><UserIcon /></span>
        <h1>Login</h1>
        <p className="quiet">ادخل باسم المستخدم وكلمة المرور.</p>
        <label className="field"><span>Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
        <label className="field"><span>Password</span><PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error ? <p className="msg-err">{error}</p> : null}
        <button className="btn btn-primary" disabled={pending} type="submit">{pending ? 'جارٍ الدخول…' : 'Login'}</button>
        <p className="quiet">ليس لديك حساب؟ <Link to="/signup">Sign up</Link></p>
      </form>
    </main>
  )
}
