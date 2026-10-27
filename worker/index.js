import { handleApi } from './api.js'
import { bindKv, hydrateFromKv } from '../server/db.js'

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
