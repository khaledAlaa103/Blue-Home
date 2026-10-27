import { handleApi } from './api.js'
import { bindKv, hydrateFromKv, readDb } from '../server/db.js'

// Serves admin-uploaded files from R2. Videos need Range support: Safari won't play them without it.
async function serveUpload(request, env, url) {
  if (!env.MEDIA) return new Response('Not found', { status: 404 })
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 })
  const key = decodeURIComponent(url.pathname.slice('/uploads/'.length))
  if (!/^(videos\/[a-f0-9]{16}\.(mp4|mov|webm|m4v)|images\/[a-f0-9]{16}\.(jpg|png|webp))$/.test(key)) return new Response('Not found', { status: 404 })
  const object = await env.MEDIA.get(key, { range: request.headers, onlyIf: request.headers })
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('accept-ranges', 'bytes')
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  if (!('body' in object)) return new Response(null, { status: 304, headers })
  const range = object.range
  if (range && request.headers.has('range')) {
    const start = range.offset ?? (object.size - range.suffix)
    const length = range.length ?? (range.suffix ?? object.size - start)
    headers.set('content-range', `bytes ${start}-${start + length - 1}/${object.size}`)
    headers.set('content-length', String(length))
    return new Response(request.method === 'HEAD' ? null : object.body, { status: 206, headers })
  }
  headers.set('content-length', String(object.size))
  return new Response(request.method === 'HEAD' ? null : object.body, { headers })
}

const xmlEscape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Built from live data so every published listing, project and area page is listed for search engines.
function sitemap(origin) {
  const db = readDb()
  const urls = [
    ['/', '1.0', 'daily'],
    ['/units', '0.9', 'daily'],
    ['/projects', '0.9', 'daily'],
    ['/lands', '0.9', 'daily'],
    ['/search', '0.7', 'daily'],
    ['/about', '0.4', 'monthly'],
    ['/contact', '0.5', 'monthly'],
  ].map(([path, priority, changefreq]) => ({ path, priority, changefreq }))
  for (const area of db.areas || []) urls.push({ path: `/search?areaId=${encodeURIComponent(area.id)}`, priority: '0.8', changefreq: 'daily' })
  for (const project of db.projects || []) {
    if (project.published) urls.push({ path: `/projects/${encodeURIComponent(project.id)}`, priority: '0.8', changefreq: 'weekly', lastmod: project.updatedAt })
  }
  for (const listing of db.listings || []) {
    if (listing.published) urls.push({ path: `/property/${encodeURIComponent(listing.id)}`, priority: '0.7', changefreq: 'weekly', lastmod: listing.updatedAt })
  }
  const body = urls.map(({ path, priority, changefreq, lastmod }) => [
    '  <url>',
    `    <loc>${xmlEscape(origin + path)}</loc>`,
    lastmod ? `    <lastmod>${xmlEscape(String(lastmod).slice(0, 10))}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n')).join('\n')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/uploads/')) return serveUpload(request, env, url)
      process.env.BLUE_HOME_CLOUD = '1'
      process.env.BLUE_HOME_LISTEN = '0'
      if (env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD
      bindKv(env.DATA)
      await hydrateFromKv()
      if (url.pathname.startsWith('/api')) return handleApi(request, env)
      if (url.pathname === '/sitemap.xml') return sitemap(url.origin)
      return env.ASSETS.fetch(request)
    } catch (error) {
      console.error(error?.stack || error)
      return new Response(JSON.stringify({ error: 'خطأ في الخادم' }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }
  },
}
