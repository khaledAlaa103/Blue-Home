import { useState } from 'react'
import { api } from '../../api'
import { directVideo } from '../../format'

export function Field({ label, children, wide }) {
  return <label className={wide ? 'field wide' : 'field'}><span>{label}</span>{children}</label>
}

// Phone and camera photos are often 3-8 MB; resize to a size that looks sharp on any screen.
const MAX_SIDE = 1600
const JPEG_QUALITY = 0.82

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(src); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('decode')) }
    img.src = src
  })
}

async function shrinkImage(file) {
  let img
  try {
    img = await loadImage(file)
  } catch {
    return file
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  if (scale === 1 && file.size <= 500 * 1024 && file.type === 'image/jpeg') return file
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob || blob.size >= file.size) return file
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`, { type: 'image/jpeg' })
}

export function ImagesField({ images, onChange }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  async function onFiles(event) {
    const files = [...event.target.files].slice(0, Math.max(0, 12 - images.length))
    event.target.value = ''
    if (!files.length) return
    setError('')
    const uploaded = []
    try {
      for (const [index, file] of files.entries()) {
        setBusy(files.length > 1 ? `جارٍ رفع الصور… ${index + 1} من ${files.length}` : 'جارٍ رفع الصورة…')
        uploaded.push((await api.upload(await shrinkImage(file))).url)
      }
    } catch (err) {
      setError(err.status === 400 ? 'الصورة دي مش مدعومة. جرّب صورة JPG أو PNG.' : err.message)
    } finally {
      if (uploaded.length) onChange([...images, ...uploaded].slice(0, 12))
      setBusy('')
    }
  }
  return (
    <div className="wide">
      <span className="field"><strong>الصور</strong></span>
      <div className="thumb-edit">
        {images.map((src) => (
          <figure key={src}>
            <img src={src} alt="" />
            <button type="button" onClick={() => { onChange(images.filter((item) => item !== src)); api.discardUpload(src) }}>حذف</button>
          </figure>
        ))}
      </div>
      <input type="file" accept="image/*" multiple disabled={Boolean(busy)} onChange={onFiles} />
      {busy ? <p className="quiet">{busy}</p> : null}
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
      if (value) api.discardUpload(value)
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
        {value ? <button type="button" className="btn btn-line" disabled={progress != null} onClick={() => { api.discardUpload(value); onChange('') }}>حذف الفيديو</button> : null}
      </div>
      {progress != null ? <progress className="upload-progress" max="100" value={progress} /> : null}
      <p className="quiet">MP4 أو MOV لحد 95 ميجا. أو حط لينك يوتيوب:</p>
      <input value={uploaded ? '' : value || ''} placeholder="https://youtube.com/..." onChange={(event) => { if (uploaded) api.discardUpload(value); onChange(event.target.value) }} />
      {error ? <p className="msg-err">{error}</p> : null}
    </div>
  )
}

export function emptyToNull(value) {
  return value === '' || value == null ? null : value
}
