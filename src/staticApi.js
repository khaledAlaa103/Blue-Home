import { applyFilters, paginate, similarTo } from '../server/filter.js'
import catalog from './catalog.json'

function fail(message, status = 404) {
  const error = new Error(message)
  error.status = status
  throw error
}

export function staticRequest(path, { method = 'GET' } = {}) {
  if (method !== 'GET') {
    fail('هذه النسخة للعرض فقط، والإرسال ولوحة التحكم يحتاجان الاستضافة الكاملة.', 400)
  }

  const url = new URL(path, 'http://blue-home.local')
  const query = Object.fromEntries(url.searchParams.entries())
  const listings = catalog.listings.filter((item) => item.published !== false)
  const projects = catalog.projects.filter((item) => item.published !== false)
  const areas = catalog.areas.map((area) => ({
    id: area.id,
    name: area.name,
    count: listings.filter((item) => item.areaId === area.id).length,
  }))

  if (url.pathname === '/api/health') return { ok: true }
  if (url.pathname === '/api/bootstrap') {
    return {
      settings: catalog.settings,
      areas,
      projects: projects.map((project) => ({ id: project.id, name: project.name, areaId: project.areaId })),
    }
  }
  if (url.pathname === '/api/home') {
    return {
      settings: catalog.settings,
      areas,
      projects: projects.filter((project) => project.featured).slice(0, 3),
      latest: applyFilters(listings, { publishedOnly: true, group: 'units' }).filter((item) => item.status !== 'sold').slice(0, 6),
      lands: applyFilters(listings, { publishedOnly: true, group: 'lands' }).filter((item) => item.status !== 'sold').slice(0, 3),
      offers: applyFilters(listings, { publishedOnly: true, offers: '1' }).slice(0, 6),
      testimonials: catalog.testimonials,
      counts: {
        units: listings.filter((item) => item.status === 'available' && item.type !== 'أرض').length,
        lands: listings.filter((item) => item.status === 'available' && item.type === 'أرض').length,
        projects: projects.length,
      },
      hasSample: listings.some((item) => item.isSample) || projects.some((item) => item.isSample),
    }
  }
  if (url.pathname === '/api/projects') {
    let items = projects
    if (query.areaId) items = items.filter((project) => project.areaId === query.areaId)
    if (query.q) items = items.filter((project) => project.name.includes(String(query.q).trim()))
    return { items }
  }
  if (url.pathname === '/api/listings') {
    return paginate(applyFilters(listings, { ...query, publishedOnly: true }), query)
  }
  if (url.pathname === '/api/testimonials') return { items: catalog.testimonials }

  const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/)
  if (projectMatch) {
    const project = projects.find((item) => item.id === decodeURIComponent(projectMatch[1]))
    if (!project) fail('المشروع غير موجود')
    return { project, listings: applyFilters(listings, { publishedOnly: true, projectId: project.id }) }
  }

  const similarMatch = url.pathname.match(/^\/api\/listings\/([^/]+)\/similar$/)
  if (similarMatch) {
    const item = listings.find((entry) => entry.id === decodeURIComponent(similarMatch[1]))
    return { items: item ? similarTo(listings, item) : [] }
  }

  const listingMatch = url.pathname.match(/^\/api\/listings\/([^/]+)$/)
  if (listingMatch) {
    const item = listings.find((entry) => entry.id === decodeURIComponent(listingMatch[1]))
    if (!item) fail('الإعلان غير موجود')
    return item
  }

  fail('غير موجود')
}
