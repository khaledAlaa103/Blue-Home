import { useState } from 'react'
import { api } from '../../api'
import { directVideo } from '../../format'

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

export function VideoField({ value, onChange }) {
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const uploaded = directVideo(value).startsWith('/uploads/')

  async function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setProgress(0)
    try {
      const { url } = await api.uploadVideo(file, setProgress)
      onChange(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="wide video-field">
      <span className="field"><strong>الفيديو</strong></span>
      {directVideo(value) ? <video className="video-preview" src={directVideo(value)} controls playsInline preload="metadata" /> : null}
      <div className="actions">
        <label className={progress == null ? 'btn btn-navy' : 'btn btn-navy is-busy'}>
          {progress == null ? (value ? 'تغيير الفيديو' : 'اختار فيديو من الجهاز') : `جارٍ الرفع… ${progress}%`}
          <input type="file" accept="video/mp4,video/quicktime,video/webm,video/*" hidden disabled={progress != null} onChange={onFile} />
        </label>
        {value ? <button type="button" className="btn btn-line" disabled={progress != null} onClick={() => onChange('')}>حذف الفيديو</button> : null}
      </div>
      {progress != null ? <progress className="upload-progress" max="100" value={progress} /> : null}
      <p className="quiet">MP4 أو MOV لحد 95 ميجا. أو حط لينك يوتيوب:</p>
      <input value={uploaded ? '' : value || ''} placeholder="https://youtube.com/..." onChange={(event) => onChange(event.target.value)} />
      {error ? <p className="msg-err">{error}</p> : null}
    </div>
  )
}

export function emptyToNull(value) {
  return value === '' || value == null ? null : value
}
