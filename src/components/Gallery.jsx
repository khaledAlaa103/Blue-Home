import { useEffect, useState } from 'react'
import { Cover } from './Cards'

export function Gallery({ images = [], title }) {
  const [active, setActive] = useState(null)
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (active == null) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event) {
      if (event.key === 'Escape') setActive(null)
      if (event.key === 'ArrowLeft') setActive((index) => Math.min(images.length - 1, index + 1))
      if (event.key === 'ArrowRight') setActive((index) => Math.max(0, index - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [active, images.length])
  if (!images.length) return <div className="ph large">لا توجد صور مضافة</div>
  const shown = images[current] || images[0]
  return (
    <div>
      <button className="gallery-main" type="button" onClick={() => setActive(current)}>
        <Cover src={shown} alt={`${title} - صورة ${current + 1}`} whole />
      </button>
      {images.length > 1 ? (
        <div className="thumbs">
          {images.map((src, index) => (
            <button key={src + index} type="button" className={index === current ? 'on' : ''} onClick={() => setCurrent(index)}>
              <Cover src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      {active != null ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="معرض الصور" onClick={() => setActive(null)}>
          <img src={images[active]} alt={`${title} - صورة ${active + 1}`} onClick={(event) => event.stopPropagation()} />
          <div className="actions" onClick={(event) => event.stopPropagation()}>
            <button className="btn btn-line" type="button" onClick={() => setActive((index) => Math.max(0, index - 1))} disabled={active === 0}>السابق</button>
            <button className="btn btn-line" type="button" onClick={() => setActive(null)}>إغلاق</button>
            <button className="btn btn-line" type="button" onClick={() => setActive((index) => Math.min(images.length - 1, index + 1))} disabled={active === images.length - 1}>التالي</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
