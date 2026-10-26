import { useState } from 'react'
import { api } from '../../api'

export function Field({ label, children, wide }) {
  return <label className={wide ? 'field wide' : 'field'}><span>{label}</span>{children}</label>
}

export function ImagesField({ images, onChange }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  async function onFiles(event) {
    const files = [...event.target.files]
    event.target.value = ''
    try {
      const uploaded = []
      for (const file of files) uploaded.push((await api.upload(file)).url)
      onChange([...images, ...uploaded].slice(0, 12))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <div className="wide">
      <span className="field"><strong>الصور</strong></span>
      <div className="thumb-edit">
        {images.map((src) => (
          <figure key={src}>
            <img src={src} alt="" />
            <button type="button" onClick={() => onChange(images.filter((item) => item !== src))}>حذف</button>
          </figure>
        ))}
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} />
      <div className="actions">
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="أو رابط https للصورة" />
        <button className="btn btn-line" type="button" onClick={() => { if (!url.startsWith('https://')) return setError('استخدم رابط https'); onChange([...images, url].slice(0, 12)); setUrl(''); setError('') }}>إضافة الرابط</button>
      </div>
      {error ? <p className="msg-err">{error}</p> : null}
    </div>
  )
}

export function emptyToNull(value) {
  return value === '' || value == null ? null : value
}
