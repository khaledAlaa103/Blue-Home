import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { pinIcon, TILE_OPTIONS, TILES } from './mapPin'

// Street-level map of one property with its pin; drawn by us, so it always shows (unlike an embedded Google map).
export function PropertyMap({ coords, label, title }) {
  const node = useRef(null)
  const [lat, lng] = coords

  useEffect(() => {
    if (!node.current) return undefined
    const map = L.map(node.current, { scrollWheelZoom: false }).setView([lat, lng], 16)
    L.tileLayer(TILES, TILE_OPTIONS).addTo(map)
    L.marker([lat, lng], { icon: pinIcon(label), title, keyboard: false }).addTo(map)
    const resize = new ResizeObserver(() => map.invalidateSize())
    resize.observe(node.current)
    return () => {
      resize.disconnect()
      map.remove()
    }
  }, [lat, lng, label, title])

  return <div ref={node} className="map-embed" role="img" aria-label={title} />
}
