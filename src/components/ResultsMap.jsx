import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatPrice } from '../format'
import { useSignedIn } from './PriceGate'

export function ResultsMap({ items, active }) {
  const node = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const navigate = useNavigate()
  const signedIn = useSignedIn()

  useEffect(() => {
    if (!node.current || mapRef.current) return undefined
    const map = L.map(node.current, { scrollWheelZoom: false }).setView([29.98, 30.95], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
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
    if (!map || !layer) return
    layer.clearLayers()
    // Number(null) is 0, which would drop a pin off the coast of Africa and zoom the map out to the whole world.
    const located = (value) => value !== null && value !== '' && Number.isFinite(Number(value))
    const points = items.filter((item) => located(item.lat) && located(item.lng))
    points.forEach((item) => {
      const label = signedIn && item.price != null ? formatPrice(item.price).replace(' ج.م', '') : item.type
      const icon = L.divIcon({ className: 'price-pin', html: `<span>${label}</span>`, iconAnchor: [30, 14] })
      L.marker([Number(item.lat), Number(item.lng)], { icon }).addTo(layer).on('click', () => navigate(`/property/${item.id}`))
    })
    // Measure the frame first (it may have just become visible), then zoom to the properties.
    const timer = setTimeout(() => {
      map.invalidateSize()
      if (points.length === 1) map.setView([Number(points[0].lat), Number(points[0].lng)], 16)
      else if (points.length) map.fitBounds(points.map((item) => [Number(item.lat), Number(item.lng)]), { padding: [40, 40], maxZoom: 16 })
      else map.setView([29.98, 30.95], 11)
    }, 60)
    return () => clearTimeout(timer)
  }, [items, active, navigate, signedIn])

  return <div ref={node} className="map-frame" />
}
