import { useEffect, useRef, useState } from 'react'
import { Cover, NoPhoto } from './Cards'

// Swipe between photos on phones. The page is RTL, so dragging right moves to the next photo.
function useSwipe(onNext, onPrevious) {
  const start = useRef(null)
  const moved = useRef(false)
  return {
    onTouchStart(event) {
      const touch = event.touches[0]
      start.current = { x: touch.clientX, y: touch.clientY }
      moved.current = false
    },
    onTouchEnd(event) {
      if (!start.current) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - start.current.x
      const dy = touch.clientY - start.current.y
      start.current = null
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
      moved.current = true
      if (dx > 0) onNext()
      else onPrevious()
    },
    // A swipe ends with a click on the same element; skip it so it doesn't open or close the viewer.
    swiped() {
      const was = moved.current
      moved.current = false
      return was
    },
  }
}

export function Gallery({ images = [], title, type }) {
  const [active, setActive] = useState(null)
  const [current, setCurrent] = useState(0)
  const last = images.length - 1
  const mainSwipe = useSwipe(() => setCurrent((index) => Math.min(last, index + 1)), () => setCurrent((index) => Math.max(0, index - 1)))
  const boxSwipe = useSwipe(() => setActive((index) => Math.min(last, index + 1)), () => setActive((index) => Math.max(0, index - 1)))
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
  // Keep the chosen thumbnail in view when swiping through the main photo.
  const thumbs = useRef(null)
  useEffect(() => {
    const row = thumbs.current
    const thumb = row?.children[current]
    if (!thumb) return
    // Scroll the row sideways only; scrollIntoView could also move the page.
    const box = row.getBoundingClientRect()
    const rect = thumb.getBoundingClientRect()
    if (rect.left < box.left) row.scrollLeft -= box.left - rect.left
    else if (rect.right > box.right) row.scrollLeft += rect.right - box.right
  }, [current])
  if (!images.length) return <NoPhoto large type={type} label={title} />
  const shown = images[current] || images[0]
  return (
    <div>
      <button className="gallery-main" type="button" onClick={() => { if (!mainSwipe.swiped()) setActive(current) }} onTouchStart={mainSwipe.onTouchStart} onTouchEnd={mainSwipe.onTouchEnd}>
        <Cover src={shown} alt={`${title} - صورة ${current + 1}`} whole />
        {images.length > 1 ? <span className="gallery-count">{current + 1} / {images.length}</span> : null}
      </button>
      {images.length > 1 ? (
        <div className="thumbs" ref={thumbs}>
          {images.map((src, index) => (
            <button key={src + index} type="button" className={index === current ? 'on' : ''} onClick={() => setCurrent(index)}>
              <Cover src={src} alt="" whole />
            </button>
          ))}
        </div>
      ) : null}
      {active != null ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="معرض الصور" onClick={() => { if (!boxSwipe.swiped()) setActive(null) }} onTouchStart={boxSwipe.onTouchStart} onTouchEnd={boxSwipe.onTouchEnd}>
          <img src={images[active]} alt={`${title} - صورة ${active + 1}`} onClick={(event) => event.stopPropagation()} />
          {images.length > 1 ? <span className="lightbox-count">{active + 1} / {images.length}</span> : null}
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
