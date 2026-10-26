import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatPrice } from '../format'

export function ResultsMap({ items, active }) {
  const node = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!node.current || mapRef.current) return undefined
    const map = L.map(node.current, { scrollWheelZoom: false }).setView([29.98, 30.95], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const points = items.filter((item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)))
    points.forEach((item) => {
      const label = item.price != null ? formatPrice(item.price).replace(' ج.م', '') : item.type
      const icon = L.divIcon({ className: 'price-pin', html: `<span>${label}</span>`, iconAnchor: [30, 14] })
      L.marker([Number(item.lat), Number(item.lng)], { icon }).addTo(layer).on('click', () => navigate(`/property/${item.id}`))
    })
    if (points.length) {
      map.fitBounds(points.map((item) => [Number(item.lat), Number(item.lng)]), { padding: [30, 30], maxZoom: 13 })
    } else map.setView([29.98, 30.95], 11)
    setTimeout(() => map.invalidateSize(), 80)
  }, [items, active, navigate])

  return <div ref={node} className="map-frame" />
}
