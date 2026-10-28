import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_OPTIONS = { attribution: '&copy; OpenStreetMap', maxZoom: 19 }
// 6th of October / Sheikh Zayed, for maps with no property to center on.
export const DEFAULT_CENTER = [29.98, 30.95]

const escape = (text) => String(text ?? '').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`)

// A blue house pin with the property's type (or price) above it; the tip of the pin sits on the location.
export function pinIcon(label) {
  return L.divIcon({
    className: 'bh-pin',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<span class="bh-pin-inner">${label ? `<span class="bh-pin-label">${escape(label)}</span>` : ''}<span class="bh-pin-head"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11.5 12 5.5l7 6M7 10v8.5h10V10" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>`,
  })
}
