import {
  readDb,
  mutate,
  enrichListing,
  enrichProject,
  publicSettings,
  forgetImages,
  hashPassword,
  passwordMatches,
} from '../server/db.js'
import { applyFilters, paginate, similarTo } from '../server/filter.js'
import { parseProject, parseListing, parseArea, parseSettings, parseTestimonial, parseInquiry } from '../server/validate.js'
import { accountExpired, customerRows, enforceCustomerLimits, isCurrent, RETENTION_YEARS, signupCount, USER_LIMIT } from '../server/customers.js'
import { IMAGE_MAX_BYTES, IMAGE_TYPES, VIDEO_TYPES, videoUploadError } from '../server/video.js'
import { latinDigits } from '../shared/constants.js'

const attempts = new Map()
const encoder = new TextEncoder()

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function fail(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function roleOf(user) {
  if (user?.role === 'admin' || user?.role === 'user') return user.role
  return user?.username === 'admin' ? 'admin' : 'user'
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: roleOf(user),
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  }
}

function listingsOf(db) {
  return db.listings.map((item) => enrichListing(db, item))
}

function randomId() {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes) {
  let binary = ''
  const size = 0x8000
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size))
  }
  return btoa(binary)
}

function base64UrlEncode(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function signToken(payload, secret) {
  const body = base64UrlEncode(encoder.encode(JSON.stringify({ ...payload, exp: Date.now() + 12 * 60 * 60 * 1000 })))
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`
}

async function readUser(request) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const db = readDb()
  const key = await crypto.subtle.importKey('raw', encoder.encode(db.jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const ok = await crypto.subtle.verify('HMAC', key, base64UrlDecode(signature), encoder.encode(body))
  if (!ok) return null
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)))
  if (!payload?.exp || payload.exp < Date.now()) return null
  return db.users.find((user) => user.id === payload.sub) || null
}

function queryOf(url) {
  const query = {}
  for (const [key, value] of url.searchParams) query[key] = value
  return query
}

function matchRoute(pattern, pathname) {
  const expected = pattern.split('/')
  const actual = pathname.split('/')
  if (expected.length !== actual.length) return null
  const params = {}
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index].startsWith(':')) params[expected[index].slice(1)] = decodeURIComponent(actual[index])
    else if (expected[index] !== actual[index]) return null
  }
  return params
}

// R2 keys of every uploaded image/video the site still shows.
function uploadKeys(db) {
  const keys = new Set()
  for (const item of [...(db.projects || []), ...(db.listings || [])]) {
    for (const url of [...(item.images || []), item.videoUrl]) {
      if (typeof url === 'string' && url.startsWith('/uploads/')) keys.add(url.slice('/uploads/'.length))
    }
  }
  return keys
}

let media = null

// Any upload a save stops using (removed photo, replaced video, deleted listing) is deleted from R2 right away.
async function save(work, status = 200) {
  try {
    let removed = []
    const result = await mutate(async (db) => {
      const before = uploadKeys(db)
      const value = await work(db)
      const after = uploadKeys(db)
      removed = [...before].filter((key) => !after.has(key))
      return value
    })
    if (media && removed.length) await media.delete(removed).catch((error) => console.error('R2 delete failed', error))
    return json(result, status)
  } catch (error) {
    const code = error.status || 500
    if (code === 500) console.error(error)
    return json({ error: code === 500 ? 'خطأ في الخادم' : error.message }, code)
  }
}

async function bodyOf(request) {
  const type = request.headers.get('content-type') || ''
  if (!type.includes('application/json')) return {}
  try {
    return await request.json()
  } catch {
    return {}
  }
}

// The raw file is the request body, streamed straight into R2 so big videos never sit in memory.
async function uploadVideo(request, media) {
  if (!media) return json({ error: 'تخزين الفيديو مش متفعّل على السيرفر لسه' }, 503)
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const size = Number(request.headers.get('content-length'))
  const problem = videoUploadError(type, size)
  if (problem) return json({ error: problem }, problem.includes('حجم') ? 413 : 400)
  const key = `videos/${randomId()}.${VIDEO_TYPES[type]}`
  await media.put(key, request.body, { httpMetadata: { contentType: type } })
  return json({ url: `/uploads/${key}` })
}

// A photo/video removed in the editor before saving: delete it now unless a saved listing or project still uses it.
async function discardUpload(body) {
  const key = String(body?.url || '').replace(/^\/uploads\//, '')
  if (!/^(videos\/[a-f0-9]{16}\.(mp4|mov|webm|m4v)|images\/[a-f0-9]{16}\.(jpg|png|webp))$/.test(key)) return json({ error: 'مسار غير صالح' }, 400)
  if (uploadKeys(readDb()).has(key)) return json({ ok: true, kept: true })
  if (media) await media.delete(key)
  return json({ ok: true })
}

export async function handleApi(request, env = {}) {
  media = env.MEDIA || null
  const url = new URL(request.url)
  const query = queryOf(url)
  const user = await readUser(request).catch(() => null)
  const preview = query.preview === '1' && Boolean(user)

  if (url.pathname.startsWith('/api/admin')) {
    if (!user) return json({ error: 'يلزم تسجيل الدخول' }, 401)
    if (roleOf(user) !== 'admin') return json({ error: 'هذه الصفحة للأدمن فقط' }, 403)
  } else if ((url.pathname === '/api/auth/me' || url.pathname === '/api/auth/password') && !user) {
    return json({ error: 'يلزم تسجيل الدخول' }, 401)
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/upload-video') return uploadVideo(request, env.MEDIA)
  if (request.method === 'DELETE' && url.pathname === '/api/admin/upload') return discardUpload(await bodyOf(request))

  const route = [
    ['GET', '/api/health'],
    ['POST', '/api/auth/login'],
    ['POST', '/api/auth/register'],
    ['GET', '/api/auth/me'],
    ['POST', '/api/auth/password'],
    ['GET', '/api/bootstrap'],
    ['GET', '/api/home'],
    ['GET', '/api/projects'],
    ['GET', '/api/projects/:id'],
    ['GET', '/api/listings'],
    ['GET', '/api/listings/:id/similar'],
    ['GET', '/api/listings/:id'],
    ['POST', '/api/inquiries'],
    ['GET', '/api/testimonials'],
    ['GET', '/api/admin/summary'],
    ['GET', '/api/admin/projects'],
    ['POST', '/api/admin/projects'],
    ['PUT', '/api/admin/projects/:id'],
    ['DELETE', '/api/admin/projects/:id'],
    ['GET', '/api/admin/listings'],
    ['POST', '/api/admin/listings'],
    ['PUT', '/api/admin/listings/:id'],
    ['DELETE', '/api/admin/listings/:id'],
    ['GET', '/api/admin/areas'],
    ['POST', '/api/admin/areas'],
    ['PUT', '/api/admin/areas/:id'],
    ['DELETE', '/api/admin/areas/:id'],
    ['GET', '/api/admin/customers'],
    ['GET', '/api/admin/inquiries'],
    ['PATCH', '/api/admin/inquiries/:id'],
    ['DELETE', '/api/admin/inquiries/:id'],
    ['GET', '/api/admin/testimonials'],
    ['POST', '/api/admin/testimonials'],
    ['PUT', '/api/admin/testimonials/:id'],
    ['DELETE', '/api/admin/testimonials/:id'],
    ['PUT', '/api/admin/settings'],
    ['POST', '/api/admin/sample-data/delete'],
    ['POST', '/api/admin/upload'],
  ].find(([method, pattern]) => method === request.method && matchRoute(pattern, url.pathname))

  if (!route) return json({ error: 'غير موجود' }, 404)
  const params = matchRoute(route[1], url.pathname)
  const body = request.method === 'GET' || request.method === 'DELETE' ? {} : await bodyOf(request)

  if (route[1] === '/api/health') return json({ ok: true })

  if (route[1] === '/api/auth/login') {
    const ip = request.headers.get('cf-connecting-ip') || 'local'
    const now = Date.now()
    const recent = (attempts.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000)
    if (recent.length >= 8) return json({ error: 'محاولات كثيرة. حاول بعد عشر دقائق.' }, 429)
    const db = readDb()
    const username = String(body.username || '').trim()
    const password = String(body.password || '')
    const account = db.users.find((entry) => entry.username.toLowerCase() === username.toLowerCase())
    if (account && accountExpired(account)) {
      await mutate(() => ({ ok: true }))
      return json({ error: 'انتهت مدة هذا الحساب بعد سنتين. يمكن إنشاء حساب جديد.' }, 403)
    }
    const ok = Boolean(account) && passwordMatches(account.passwordHash, password)
    if (!ok) {
      recent.push(now)
      attempts.set(ip, recent)
      return json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, 401)
    }
    attempts.delete(ip)
    const token = await signToken({ sub: account.id, username: account.username }, db.jwtSecret)
    return json({ token, user: publicUser(account) })
  }

  if (route[1] === '/api/auth/register') {
    const firstName = String(body.firstName || '').trim()
    const lastName = String(body.lastName || '').trim()
    const phone = latinDigits(body.phone).trim()
    const username = String(body.username || '').trim()
    const password = String(body.password || '')
    const confirmPassword = String(body.confirmPassword || '')
    const address = String(body.address || '').trim()
    if (firstName.length < 2 || lastName.length < 2) return json({ error: 'اكتب الاسم الأول والاسم الثاني' }, 400)
    if (!/^[\d+\s()-]{8,20}$/.test(phone)) return json({ error: 'رقم التليفون غير صحيح' }, 400)
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) return json({ error: 'اسم المستخدم من 3 إلى 32 حرفًا إنجليزيًا أو رقمًا' }, 400)
    if (password.length < 6) return json({ error: 'كلمة المرور 6 أحرف على الأقل' }, 400)
    if (password !== confirmPassword) return json({ error: 'تأكيد كلمة المرور غير مطابق' }, 400)
    if (address.length < 3) return json({ error: 'اكتب العنوان' }, 400)
    return save((db) => {
      if (db.users.some((entry) => entry.username.toLowerCase() === username.toLowerCase())) throw fail('اسم المستخدم مستخدم')
      db.users.push({
        id: randomId(),
        username,
        passwordHash: hashPassword(password),
        role: 'user',
        firstName,
        lastName,
        phone,
        address,
        createdAt: new Date().toISOString(),
      })
      return { ok: true }
    }).then(async (response) => {
      if (response.status !== 200 && response.status !== 201) return response
      const db = readDb()
      const account = db.users.find((entry) => entry.username.toLowerCase() === username.toLowerCase())
      const token = await signToken({ sub: account.id, username: account.username }, db.jwtSecret)
      return json({ token, user: publicUser(account) }, 201)
    })
  }

  if (route[1] === '/api/auth/me') return json(publicUser(user))

  if (route[1] === '/api/auth/password') {
    return save((db) => {
      const account = db.users.find((entry) => entry.id === user.id)
      const current = String(body.current || '')
      const next = String(body.next || '')
      if (!account || !passwordMatches(account.passwordHash, current)) throw fail('كلمة المرور الحالية غير صحيحة')
      if (next.length < 6) throw fail('كلمة المرور الجديدة 6 أحرف على الأقل')
      account.passwordHash = hashPassword(next)
      return { ok: true }
    })
  }

  if (route[1] === '/api/bootstrap') {
    const db = readDb()
    const listings = db.listings.filter((item) => item.published)
    return json({
      settings: publicSettings(db.settings),
      areas: db.areas.map((area) => ({
        id: area.id,
        name: area.name,
        count: listings.filter((item) => item.areaId === area.id).length,
      })),
      projects: db.projects.filter((project) => project.published).map((project) => ({ id: project.id, name: project.name, areaId: project.areaId })),
    })
  }

  if (route[1] === '/api/home') {
    const db = readDb()
    const enriched = listingsOf(db)
    const publishedProjects = db.projects.filter((project) => project.published).map((project) => enrichProject(db, project))
    const latest = applyFilters(enriched, { publishedOnly: true, group: 'units' }).filter((item) => item.status !== 'sold').slice(0, 6)
    const lands = applyFilters(enriched, { publishedOnly: true, group: 'lands' }).filter((item) => item.status !== 'sold').slice(0, 3)
    const offers = applyFilters(enriched, { publishedOnly: true, offers: '1' }).slice(0, 6)
    const listings = db.listings.filter((item) => item.published)
    return json({
      settings: publicSettings(db.settings),
      areas: db.areas.map((area) => ({
        id: area.id,
        name: area.name,
        count: listings.filter((item) => item.areaId === area.id).length,
      })),
      projects: publishedProjects.filter((project) => project.featured).slice(0, 3),
      latest,
      lands,
      offers,
      testimonials: db.testimonials.filter((item) => item.published && item.confirmed),
      counts: {
        units: listings.filter((item) => item.status === 'available' && item.type !== 'أرض').length,
        lands: listings.filter((item) => item.status === 'available' && item.type === 'أرض').length,
        projects: publishedProjects.length,
      },
      hasSample: db.listings.some((item) => item.isSample) || db.projects.some((item) => item.isSample),
    })
  }

  if (route[1] === '/api/projects' && request.method === 'GET') {
    const db = readDb()
    let projects = db.projects.filter((project) => project.published)
    if (query.areaId) projects = projects.filter((project) => project.areaId === query.areaId)
    if (query.q) projects = projects.filter((project) => project.name.includes(String(query.q).trim()))
    return json({ items: projects.map((project) => enrichProject(db, project)) })
  }

  if (route[1] === '/api/projects/:id') {
    const db = readDb()
    const project = db.projects.find((item) => item.id === params.id)
    if (!project || (!project.published && !preview)) return json({ error: 'المشروع غير موجود' }, 404)
    const listings = applyFilters(listingsOf(db), { publishedOnly: !preview, projectId: project.id })
    return json({ project: enrichProject(db, project), listings: listings.filter((item) => item.published || preview) })
  }

  if (route[1] === '/api/listings' && request.method === 'GET') {
    const db = readDb()
    return json(paginate(applyFilters(listingsOf(db), { ...query, publishedOnly: true }), query))
  }

  if (route[1] === '/api/listings/:id/similar') {
    const db = readDb()
    const item = db.listings.find((entry) => entry.id === params.id)
    if (!item) return json({ items: [] })
    return json({ items: similarTo(listingsOf(db), item) })
  }

  if (route[1] === '/api/listings/:id') {
    const db = readDb()
    const item = listingsOf(db).find((entry) => entry.id === params.id)
    if (!item || (!item.published && !preview)) return json({ error: 'الإعلان غير موجود' }, 404)
    return json(item)
  }

  if (route[1] === '/api/inquiries') {
    const parsed = parseInquiry(body)
    if (parsed.error) return json({ error: parsed.error }, 400)
    if (parsed.value.spam) return json({ ok: true })
    return save((db) => {
      db.inquiries.unshift(parsed.value)
      return { ok: true }
    }, 201)
  }

  if (route[1] === '/api/testimonials') {
    const db = readDb()
    return json({ items: db.testimonials.filter((item) => item.published && item.confirmed) })
  }

  if (route[1] === '/api/admin/summary') {
    const db = readDb()
    return json({
      projects: db.projects.length,
      listings: db.listings.length,
      available: db.listings.filter((item) => item.published && item.status === 'available' && item.type !== 'أرض').length,
      lands: db.listings.filter((item) => item.published && item.status === 'available' && item.type === 'أرض').length,
      inquiries: db.inquiries.length,
      customers: customerRows(db).length,
      unread: db.inquiries.filter((item) => !item.read).length,
      samples: db.projects.filter((item) => item.isSample).length + db.listings.filter((item) => item.isSample).length,
      areas: db.areas.length,
    })
  }

  if (route[1] === '/api/admin/projects' && request.method === 'GET') {
    const db = readDb()
    return json({ items: db.projects.map((project) => enrichProject(db, project, { admin: true })) })
  }

  if (route[1] === '/api/admin/projects' && request.method === 'POST') {
    return save((db) => {
      if (db.projects.length >= 300) throw fail('تم بلوغ الحد الأقصى للمشاريع')
      const parsed = parseProject(body, db)
      if (parsed.error) throw fail(parsed.error)
      db.projects.unshift(parsed.value)
      return enrichProject(db, parsed.value, { admin: true })
    }, 201)
  }

  if (route[1] === '/api/admin/projects/:id' && request.method === 'PUT') {
    return save((db) => {
      const index = db.projects.findIndex((item) => item.id === params.id)
      if (index < 0) throw fail('المشروع غير موجود', 404)
      const previous = db.projects[index]
      const parsed = parseProject(body, db, previous)
      if (parsed.error) throw fail(parsed.error)
      db.projects[index] = parsed.value
      forgetImages(db, (previous.images || []).filter((image) => !(parsed.value.images || []).includes(image)))
      return enrichProject(db, parsed.value, { admin: true })
    })
  }

  if (route[1] === '/api/admin/projects/:id' && request.method === 'DELETE') {
    return save((db) => {
      const project = db.projects.find((item) => item.id === params.id)
      if (!project) throw fail('المشروع غير موجود', 404)
      db.projects = db.projects.filter((item) => item.id !== params.id)
      for (const listing of db.listings) {
        if (listing.projectId === project.id) listing.projectId = ''
      }
      forgetImages(db, project.images || [])
      return { ok: true }
    })
  }

  if (route[1] === '/api/admin/listings' && request.method === 'GET') return json({ items: listingsOf(readDb()) })

  if (route[1] === '/api/admin/listings' && request.method === 'POST') {
    return save((db) => {
      if (db.listings.length >= 2000) throw fail('تم بلوغ الحد الأقصى للإعلانات')
      const parsed = parseListing(body, db)
      if (parsed.error) throw fail(parsed.error)
      db.listings.unshift(parsed.value)
      return enrichListing(db, parsed.value)
    }, 201)
  }

  if (route[1] === '/api/admin/listings/:id' && request.method === 'PUT') {
    return save((db) => {
      const index = db.listings.findIndex((item) => item.id === params.id)
      if (index < 0) throw fail('الإعلان غير موجود', 404)
      const previous = db.listings[index]
      const parsed = parseListing(body, db, previous)
      if (parsed.error) throw fail(parsed.error)
      db.listings[index] = parsed.value
      forgetImages(db, (previous.images || []).filter((image) => !(parsed.value.images || []).includes(image)))
      return enrichListing(db, parsed.value)
    })
  }

  if (route[1] === '/api/admin/listings/:id' && request.method === 'DELETE') {
    return save((db) => {
      const listing = db.listings.find((item) => item.id === params.id)
      if (!listing) throw fail('الإعلان غير موجود', 404)
      db.listings = db.listings.filter((item) => item.id !== params.id)
      forgetImages(db, listing.images || [])
      return { ok: true }
    })
  }

  if (route[1] === '/api/admin/areas' && request.method === 'GET') return json({ items: readDb().areas })

  if (route[1] === '/api/admin/areas' && request.method === 'POST') {
    return save((db) => {
      if (db.areas.length >= 50) throw fail('تم بلوغ الحد الأقصى للمناطق')
      const parsed = parseArea(body, db)
      if (parsed.error) throw fail(parsed.error)
      db.areas.push(parsed.value)
      return parsed.value
    }, 201)
  }

  if (route[1] === '/api/admin/areas/:id' && request.method === 'PUT') {
    return save((db) => {
      const index = db.areas.findIndex((item) => item.id === params.id)
      if (index < 0) throw fail('المنطقة غير موجودة', 404)
      const parsed = parseArea(body, db, db.areas[index])
      if (parsed.error) throw fail(parsed.error)
      db.areas[index] = parsed.value
      return parsed.value
    })
  }

  if (route[1] === '/api/admin/areas/:id' && request.method === 'DELETE') {
    return save((db) => {
      const used = db.projects.some((item) => item.areaId === params.id) || db.listings.some((item) => item.areaId === params.id)
      if (used) throw fail('المنطقة مستخدمة في مشروع أو إعلان')
      const before = db.areas.length
      db.areas = db.areas.filter((item) => item.id !== params.id)
      if (db.areas.length === before) throw fail('المنطقة غير موجودة', 404)
      return { ok: true }
    })
  }

  if (route[1] === '/api/admin/customers' && request.method === 'GET') {
    const data = await mutate((db) => {
      enforceCustomerLimits(db)
      return {
        items: customerRows(db),
        limit: USER_LIMIT,
        accounts: signupCount(db),
        requests: (db.inquiries || []).length,
        retentionYears: RETENTION_YEARS,
      }
    })
    return json(data)
  }

  if (route[1] === '/api/admin/inquiries' && request.method === 'GET') {
    const db = readDb()
    return json({
      items: db.inquiries.filter((item) => isCurrent(item.createdAt)).map((item) => ({
        ...item,
        listingTitle: db.listings.find((listing) => listing.id === item.listingId)?.title || '',
        projectName: db.projects.find((project) => project.id === item.projectId)?.name || '',
      })),
    })
  }

  if (route[1] === '/api/admin/inquiries/:id' && request.method === 'PATCH') {
    return save((db) => {
      const inquiry = db.inquiries.find((item) => item.id === params.id)
      if (!inquiry) throw fail('الطلب غير موجود', 404)
      if ('read' in (body || {})) inquiry.read = Boolean(body.read)
      return inquiry
    })
  }

  if (route[1] === '/api/admin/inquiries/:id' && request.method === 'DELETE') {
    return save((db) => {
      db.inquiries = db.inquiries.filter((item) => item.id !== params.id)
      return { ok: true }
    })
  }

  if (route[1] === '/api/admin/testimonials' && request.method === 'GET') return json({ items: readDb().testimonials })

  if (route[1] === '/api/admin/testimonials' && request.method === 'POST') {
    return save((db) => {
      if (db.testimonials.length >= 50) throw fail('تم بلوغ الحد الأقصى للآراء')
      const parsed = parseTestimonial(body)
      if (parsed.error) throw fail(parsed.error)
      db.testimonials.unshift(parsed.value)
      return parsed.value
    }, 201)
  }

  if (route[1] === '/api/admin/testimonials/:id' && request.method === 'PUT') {
    return save((db) => {
      const index = db.testimonials.findIndex((item) => item.id === params.id)
      if (index < 0) throw fail('الرأي غير موجود', 404)
      const parsed = parseTestimonial(body, db.testimonials[index])
      if (parsed.error) throw fail(parsed.error)
      db.testimonials[index] = parsed.value
      return parsed.value
    })
  }

  if (route[1] === '/api/admin/testimonials/:id' && request.method === 'DELETE') {
    return save((db) => {
      db.testimonials = db.testimonials.filter((item) => item.id !== params.id)
      return { ok: true }
    })
  }

  if (route[1] === '/api/admin/settings') {
    return save((db) => {
      const parsed = parseSettings(body, db.settings)
      if (parsed.error) throw fail(parsed.error)
      db.settings = parsed.value
      return publicSettings(db.settings)
    })
  }

  if (route[1] === '/api/admin/sample-data/delete') {
    return save((db) => {
      const images = []
      db.projects = db.projects.filter((item) => {
        if (!item.isSample) return true
        images.push(...(item.images || []))
        return false
      })
      db.listings = db.listings.filter((item) => {
        if (!item.isSample) return true
        images.push(...(item.images || []))
        return false
      })
      forgetImages(db, images)
      return { ok: true }
    })
  }

  if (route[1] === '/api/admin/upload') {
    let form
    try {
      form = await request.formData()
    } catch {
      return json({ error: 'اختر صورة' }, 400)
    }
    const file = form.get('file')
    if (!file || typeof file.arrayBuffer !== 'function') return json({ error: 'اختر صورة' }, 400)
    const ext = IMAGE_TYPES[file.type]
    if (!ext) return json({ error: 'الملف لازم يكون صورة JPG أو PNG أو WebP' }, 400)
    if (file.size > IMAGE_MAX_BYTES) return json({ error: 'حجم الصورة أكبر من 8 ميجا' }, 413)
    if (!env.MEDIA) return json({ error: 'تخزين الصور مش متفعّل على السيرفر لسه' }, 503)
    const key = `images/${randomId()}.${ext}`
    await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
    return json({ url: `/uploads/${key}` })
  }

  return json({ error: 'غير موجود' }, 404)
}
