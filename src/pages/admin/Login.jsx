import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../../api'
import { Logo } from '../../components/Layout'
import { useTitle } from '../../format'

export default function Login() {
  useTitle('دخول لوحة التحكم')
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
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
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-screen">
      <form className="login-panel" onSubmit={submit}>
        <Link to="/"><Logo /></Link>
        <h1>لوحة التحكم</h1>
        <p className="quiet">الدخول لصاحب المنصة فقط.</p>
        <label className="field"><span>اسم المستخدم</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
        <label className="field"><span>كلمة المرور</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error ? <p className="msg-err">{error}</p> : null}
        <button className="btn btn-primary" disabled={pending} type="submit">{pending ? 'جارٍ الدخول…' : 'دخول'}</button>
      </form>
    </main>
  )
}
