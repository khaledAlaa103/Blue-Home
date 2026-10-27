import { useState } from 'react'

function Eye({ off }) {
  if (off) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10.5 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.1 3.7M6.2 6.8C3.8 8.5 2 12 2 12s3.5 6 10 6c1.2 0 2.4-.2 3.5-.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function PasswordInput({ value, onChange, autoComplete, required }) {
  const [shown, setShown] = useState(false)
  return (
    <span className="password-field">
      <input type={shown ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required={required} />
      <button
        className="password-toggle"
        type="button"
        aria-pressed={shown}
        aria-label={shown ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setShown((current) => !current)}
      >
        <Eye off={shown} />
      </button>
    </span>
  )
}
