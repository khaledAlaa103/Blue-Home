import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { coordsOf, formatPrice } from '../format'
import { DEFAULT_CENTER, pinIcon, TILE_OPTIONS, TILES } from './mapPin'
import { useSignedIn } from './PriceGate'

export function ResultsMap({ items, active }) {
  const node = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const navigate = useNavigate()
  const signedIn = useSignedIn()

  useEffect(() => {
    if (!node.current || mapRef.current) return undefined
    const map = L.map(node.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 11)
    L.tileLayer(TILES, TILE_OPTIONS).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    // Keep tiles filling the frame when the phone rotates or the panel opens.
    const resize = new ResizeObserver(() => map.invalidateSize())
    resize.observe(node.current)
    return () => {
      resize.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return undefined
    layer.clearLayers()
    const points = items.map((item) => ({ item, at: coordsOf(item.lat, item.lng) })).filter((point) => point.at)
    points.forEach(({ item, at }) => {
      const label = signedIn && item.price != null ? formatPrice(item.price).replace(' ج.م', '') : item.type
      L.marker(at, { icon: pinIcon(label), title: item.title }).addTo(layer).on('click', () => navigate(`/property/${item.id}`))
    })
    // Measure the frame first (it may have just become visible), then zoom to the properties.
    const timer = setTimeout(() => {
      map.invalidateSize()
      if (points.length === 1) map.setView(points[0].at, 16)
      else if (points.length) map.fitBounds(points.map((point) => point.at), { padding: [50, 50], maxZoom: 16 })
      else map.setView(DEFAULT_CENTER, 11)
    }, 60)
    return () => clearTimeout(timer)
  }, [items, active, navigate, signedIn])

  return <div ref={node} className="map-frame" />
}
