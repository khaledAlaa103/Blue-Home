import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { ensureDb, readDb, mutate, enrichListing, enrichProject, publicSettings, forgetImages, uploadDir, hashPassword, passwordMatches, isCloud } from './db.js'
import { applyFilters, paginate, similarTo } from './filter.js'
import { parseProject, parseListing, parseArea, parseSettings, parseTestimonial, parseInquiry } from './validate.js'
import { accountExpired, customerRows, enforceCustomerLimits, isCurrent, RETENTION_YEARS, signupCount, USER_LIMIT } from './customers.js'
import { VIDEO_MAX_BYTES, VIDEO_TYPES, videoUploadError } from './video.js'
import { latinDigits } from '../shared/constants.js'

const __dirname = (() => {
  try {
    return import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : path.join('/tmp', 'blue-home')
  } catch {
    return path.join('/tmp', 'blue-home')
  }
})()
const app = express()
const isProd = process.env.NODE_ENV === 'production'
const attempts = new Map()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(cors())
app.use(express.json({ limit: '8mb' }))
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
app.use('/uploads', express.static(uploadDir, { maxAge: '7d', index: false }))

ensureDb()

function httpError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function readUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  const db = readDb()
  try {
    const payload = jwt.verify(token, db.jwtSecret)
    return db.users.find((user) => user.id === payload.sub) || null
  } catch {
    return null
  }
}

function roleOf(user) {
  if (user?.role === 'admin' || user?.role === 'user') return user.role
  return user?.username === 'admin' ? 'admin' : 'user'
}

function auth(req, res, next) {
  const user = readUser(req)
  if (!user) return res.status(401).json({ error: 'يلزم تسجيل الدخول' })
  if (req.path.startsWith('/api/admin') && roleOf(user) !== 'admin') {
    return res.status(403).json({ error: 'هذه الصفحة للأدمن فقط' })
  }
  req.user = user
  next()
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

function canPreview(req) {
  return req.query.preview === '1' && Boolean(readUser(req))
}

async function save(res, work, status = 200) {
  try {
    const result = await mutate(work)
    res.status(status).json(result)
  } catch (error) {
    const code = error.status || 500
    res.status(code).json({ error: code === 500 ? 'خطأ في الخادم' : error.message })
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const ip = req.ip || 'local'
    const now = Date.now()
    const recent = (attempts.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000)
    if (recent.length >= 8) return res.status(429).json({ error: 'محاولات كثيرة. حاول بعد عشر دقائق.' })
    const db = readDb()
    const username = String(req.body?.username || '').trim()
    const password = String(req.body?.password || '')
    const user = db.users.find((entry) => entry.username.toLowerCase() === username.toLowerCase())
    if (user && accountExpired(user)) {
      await mutate(() => ({ ok: true }))
      return res.status(403).json({ error: 'انتهت مدة هذا الحساب بعد سنتين. يمكن إنشاء حساب جديد.' })
    }
    let ok = false
    try {
      ok = Boolean(user) && passwordMatches(user.passwordHash, password)
    } catch {
      ok = false
    }
    if (!ok) {
      recent.push(now)
      attempts.set(ip, recent)
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' })
    }
    attempts.delete(ip)
    const token = jwt.sign({ sub: user.id, username: user.username }, db.jwtSecret, { expiresIn: '12h' })
    res.json({ token, user: publicUser(user) })
  } catch {
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.post('/api/auth/register', (req, res) => {
  const firstName = String(req.body?.firstName || '').trim()
  const lastName = String(req.body?.lastName || '').trim()
  const phone = latinDigits(req.body?.phone).trim()
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')
  const confirmPassword = String(req.body?.confirmPassword || '')
  const address = String(req.body?.address || '').trim()
  if (firstName.length < 2 || lastName.length < 2) return res.status(400).json({ error: 'اكتب الاسم الأول والاسم الثاني' })
  if (!/^[\d+\s()-]{8,20}$/.test(phone)) return res.status(400).json({ error: 'رقم التليفون غير صحيح' })
  if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) return res.status(400).json({ error: 'اسم المستخدم من 3 إلى 32 حرفًا إنجليزيًا أو رقمًا' })
  if (password.length < 6) return res.status(400).json({ error: 'كلمة المرور 6 أحرف على الأقل' })
  if (password !== confirmPassword) return res.status(400).json({ error: 'تأكيد كلمة المرور غير مطابق' })
  if (address.length < 3) return res.status(400).json({ error: 'اكتب العنوان' })
  save(res, (db) => {
    if (db.users.some((entry) => entry.username.toLowerCase() === username.toLowerCase())) throw httpError('اسم المستخدم مستخدم')
    const user = {
      id: crypto.randomBytes(8).toString('hex'),
      username,
      passwordHash: hashPassword(password),
      role: 'user',
      firstName,
      lastName,
      phone,
      address,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    const token = jwt.sign({ sub: user.id, username: user.username }, db.jwtSecret, { expiresIn: '12h' })
    return { token, user: publicUser(user) }
  }, 201)
})

app.get('/api/auth/me', auth, (req, res) => {
  res.json(publicUser(req.user))
})

app.post('/api/auth/password', auth, (req, res) => {
  save(res, (db) => {
    const user = db.users.find((entry) => entry.id === req.user.id)
    const current = String(req.body?.current || '')
    const next = String(req.body?.next || '')
    if (!user || !passwordMatches(user.passwordHash, current)) throw httpError('كلمة المرور الحالية غير صحيحة')
    if (next.length < 6) throw httpError('كلمة المرور الجديدة 6 أحرف على الأقل')
    user.passwordHash = hashPassword(next)
    return { ok: true }
  })
})

app.get('/api/bootstrap', (req, res) => {
  const db = readDb()
  const listings = db.listings.filter((item) => item.published)
  res.json({
    settings: publicSettings(db.settings),
    areas: db.areas.map((area) => ({
      id: area.id,
      name: area.name,
      count: listings.filter((item) => item.areaId === area.id).length,
    })),
    projects: db.projects.filter((project) => project.published).map((project) => ({ id: project.id, name: project.name, areaId: project.areaId })),
  })
})

app.get('/api/home', (req, res) => {
  const db = readDb()
  const enriched = listingsOf(db)
  const publishedProjects = db.projects.filter((project) => project.published).map((project) => enrichProject(db, project))
  const latest = applyFilters(enriched, { publishedOnly: true, group: 'units' }).filter((item) => item.status !== 'sold').slice(0, 6)
  const lands = applyFilters(enriched, { publishedOnly: true, group: 'lands' }).filter((item) => item.status !== 'sold').slice(0, 3)
  const offers = applyFilters(enriched, { publishedOnly: true, offers: '1' }).slice(0, 6)
  const listings = db.listings.filter((item) => item.published)
  res.json({
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
})

app.get('/api/projects', (req, res) => {
  const db = readDb()
  let projects = db.projects.filter((project) => project.published)
  if (req.query.areaId) projects = projects.filter((project) => project.areaId === req.query.areaId)
  if (req.query.q) projects = projects.filter((project) => project.name.includes(String(req.query.q).trim()))
  res.json({ items: projects.map((project) => enrichProject(db, project)) })
})

app.get('/api/projects/:id', (req, res) => {
  const db = readDb()
  const project = db.projects.find((item) => item.id === req.params.id)
  if (!project || (!project.published && !canPreview(req))) return res.status(404).json({ error: 'المشروع غير موجود' })
  const listings = applyFilters(listingsOf(db), { publishedOnly: !canPreview(req), projectId: project.id })
  res.json({ project: enrichProject(db, project), listings: listings.filter((item) => item.published || canPreview(req)) })
})

app.get('/api/listings', (req, res) => {
  const db = readDb()
  const filtered = applyFilters(listingsOf(db), { ...req.query, publishedOnly: true })
  res.json(paginate(filtered, req.query))
})

app.get('/api/listings/:id', (req, res) => {
  const db = readDb()
  const item = listingsOf(db).find((entry) => entry.id === req.params.id)
  if (!item || (!item.published && !canPreview(req))) return res.status(404).json({ error: 'الإعلان غير موجود' })
  res.json(item)
})

app.get('/api/listings/:id/similar', (req, res) => {
  const db = readDb()
  const item = db.listings.find((entry) => entry.id === req.params.id)
  if (!item) return res.json({ items: [] })
  res.json({ items: similarTo(listingsOf(db), item) })
})

app.post('/api/inquiries', (req, res) => {
  const parsed = parseInquiry(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })
  if (parsed.value.spam) return res.json({ ok: true })
  save(res, (db) => {
    db.inquiries.unshift(parsed.value)
    return { ok: true }
  }, 201)
})

app.get('/api/testimonials', (req, res) => {
  const db = readDb()
  res.json({ items: db.testimonials.filter((item) => item.published && item.confirmed) })
})

app.get('/api/admin/summary', auth, (req, res) => {
  const db = readDb()
  res.json({
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
})

app.get('/api/admin/projects', auth, (req, res) => {
  const db = readDb()
  res.json({ items: db.projects.map((project) => enrichProject(db, project, { admin: true })) })
})

app.post('/api/admin/projects', auth, (req, res) => {
  save(res, (db) => {
    if (db.projects.length >= 300) throw httpError('تم بلوغ الحد الأقصى للمشاريع')
    const parsed = parseProject(req.body, db)
    if (parsed.error) throw httpError(parsed.error)
    db.projects.unshift(parsed.value)
    return enrichProject(db, parsed.value, { admin: true })
  }, 201)
})

app.put('/api/admin/projects/:id', auth, (req, res) => {
  save(res, (db) => {
    const index = db.projects.findIndex((item) => item.id === req.params.id)
    if (index < 0) throw httpError('المشروع غير موجود', 404)
    const previous = db.projects[index]
    const parsed = parseProject(req.body, db, previous)
    if (parsed.error) throw httpError(parsed.error)
    db.projects[index] = parsed.value
    forgetImages(db, (previous.images || []).filter((url) => !(parsed.value.images || []).includes(url)))
    return enrichProject(db, parsed.value, { admin: true })
  })
})

app.delete('/api/admin/projects/:id', auth, (req, res) => {
  save(res, (db) => {
    const project = db.projects.find((item) => item.id === req.params.id)
    if (!project) throw httpError('المشروع غير موجود', 404)
    db.projects = db.projects.filter((item) => item.id !== req.params.id)
    for (const listing of db.listings) {
      if (listing.projectId === project.id) listing.projectId = ''
    }
    forgetImages(db, project.images || [])
    return { ok: true }
  })
})

app.get('/api/admin/listings', auth, (req, res) => {
  const db = readDb()
  res.json({ items: listingsOf(db) })
})

app.post('/api/admin/listings', auth, (req, res) => {
  save(res, (db) => {
    if (db.listings.length >= 2000) throw httpError('تم بلوغ الحد الأقصى للإعلانات')
    const parsed = parseListing(req.body, db)
    if (parsed.error) throw httpError(parsed.error)
    db.listings.unshift(parsed.value)
    return enrichListing(db, parsed.value)
  }, 201)
})

app.put('/api/admin/listings/:id', auth, (req, res) => {
  save(res, (db) => {
    const index = db.listings.findIndex((item) => item.id === req.params.id)
    if (index < 0) throw httpError('الإعلان غير موجود', 404)
    const previous = db.listings[index]
    const parsed = parseListing(req.body, db, previous)
    if (parsed.error) throw httpError(parsed.error)
    db.listings[index] = parsed.value
    forgetImages(db, (previous.images || []).filter((url) => !(parsed.value.images || []).includes(url)))
    return enrichListing(db, parsed.value)
  })
})

app.delete('/api/admin/listings/:id', auth, (req, res) => {
  save(res, (db) => {
    const listing = db.listings.find((item) => item.id === req.params.id)
    if (!listing) throw httpError('الإعلان غير موجود', 404)
    db.listings = db.listings.filter((item) => item.id !== req.params.id)
    forgetImages(db, listing.images || [])
    return { ok: true }
  })
})

app.get('/api/admin/areas', auth, (req, res) => {
  res.json({ items: readDb().areas })
})

app.post('/api/admin/areas', auth, (req, res) => {
  save(res, (db) => {
    if (db.areas.length >= 50) throw httpError('تم بلوغ الحد الأقصى للمناطق')
    const parsed = parseArea(req.body, db)
    if (parsed.error) throw httpError(parsed.error)
    db.areas.push(parsed.value)
    return parsed.value
  }, 201)
})

app.put('/api/admin/areas/:id', auth, (req, res) => {
  save(res, (db) => {
    const index = db.areas.findIndex((item) => item.id === req.params.id)
    if (index < 0) throw httpError('المنطقة غير موجودة', 404)
    const parsed = parseArea(req.body, db, db.areas[index])
    if (parsed.error) throw httpError(parsed.error)
    db.areas[index] = parsed.value
    return parsed.value
  })
})

app.delete('/api/admin/areas/:id', auth, (req, res) => {
  save(res, (db) => {
    const used = db.projects.some((item) => item.areaId === req.params.id) || db.listings.some((item) => item.areaId === req.params.id)
    if (used) throw httpError('المنطقة مستخدمة في مشروع أو إعلان')
    const before = db.areas.length
    db.areas = db.areas.filter((item) => item.id !== req.params.id)
    if (db.areas.length === before) throw httpError('المنطقة غير موجودة', 404)
    return { ok: true }
  })
})

app.get('/api/admin/customers', auth, async (req, res) => {
  try {
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
    res.json(data)
  } catch {
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.get('/api/admin/inquiries', auth, (req, res) => {
  const db = readDb()
  const items = db.inquiries.filter((item) => isCurrent(item.createdAt)).map((item) => ({
    ...item,
    listingTitle: db.listings.find((listing) => listing.id === item.listingId)?.title || '',
    projectName: db.projects.find((project) => project.id === item.projectId)?.name || '',
  }))
  res.json({ items })
})

app.patch('/api/admin/inquiries/:id', auth, (req, res) => {
  save(res, (db) => {
    const inquiry = db.inquiries.find((item) => item.id === req.params.id)
    if (!inquiry) throw httpError('الطلب غير موجود', 404)
    if ('read' in (req.body || {})) inquiry.read = Boolean(req.body.read)
    return inquiry
  })
})

app.delete('/api/admin/inquiries/:id', auth, (req, res) => {
  save(res, (db) => {
    db.inquiries = db.inquiries.filter((item) => item.id !== req.params.id)
    return { ok: true }
  })
})

app.get('/api/admin/testimonials', auth, (req, res) => {
  res.json({ items: readDb().testimonials })
})

app.post('/api/admin/testimonials', auth, (req, res) => {
  save(res, (db) => {
    if (db.testimonials.length >= 50) throw httpError('تم بلوغ الحد الأقصى للآراء')
    const parsed = parseTestimonial(req.body)
    if (parsed.error) throw httpError(parsed.error)
    db.testimonials.unshift(parsed.value)
    return parsed.value
  }, 201)
})

app.put('/api/admin/testimonials/:id', auth, (req, res) => {
  save(res, (db) => {
    const index = db.testimonials.findIndex((item) => item.id === req.params.id)
    if (index < 0) throw httpError('الرأي غير موجود', 404)
    const parsed = parseTestimonial(req.body, db.testimonials[index])
    if (parsed.error) throw httpError(parsed.error)
    db.testimonials[index] = parsed.value
    return parsed.value
  })
})

app.delete('/api/admin/testimonials/:id', auth, (req, res) => {
  save(res, (db) => {
    db.testimonials = db.testimonials.filter((item) => item.id !== req.params.id)
    return { ok: true }
  })
})

app.put('/api/admin/settings', auth, (req, res) => {
  save(res, (db) => {
    const parsed = parseSettings(req.body, db.settings)
    if (parsed.error) throw httpError(parsed.error)
    db.settings = parsed.value
    return publicSettings(db.settings)
  })
})

app.post('/api/admin/sample-data/delete', auth, (req, res) => {
  save(res, (db) => {
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
})

const upload = multer({
  storage: isCloud()
    ? multer.memoryStorage()
    : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase()
        const safe = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg'
        cb(null, `${crypto.randomBytes(8).toString('hex')}${safe}`)
      },
    }),
  limits: { fileSize: isCloud() ? 1.5 * 1024 * 1024 : 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(httpError('الملف لازم يكون صورة JPG أو PNG أو WebP'))
  },
})

app.post('/api/admin/upload', auth, (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) return next(error)
    if (!req.file) return res.status(400).json({ error: 'اختر صورة' })
    if (isCloud()) {
      const mime = req.file.mimetype || 'image/jpeg'
      return res.json({ url: `data:${mime};base64,${req.file.buffer.toString('base64')}` })
    }
    res.json({ url: `/uploads/${req.file.filename}` })
  })
})

// The raw file is the request body; stream it to disk under uploads/videos/.
app.post('/api/admin/upload-video', auth, (req, res) => {
  if (isCloud()) return res.status(503).json({ error: 'تخزين الفيديو مش متفعّل على السيرفر لسه' })
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
  const size = Number(req.headers['content-length'])
  const problem = videoUploadError(type, size)
  if (problem) return res.status(problem.includes('حجم') ? 413 : 400).json({ error: problem })
  const dir = path.join(uploadDir, 'videos')
  fs.mkdirSync(dir, { recursive: true })
  const name = `${crypto.randomBytes(8).toString('hex')}.${VIDEO_TYPES[type]}`
  const target = path.join(dir, name)
  const out = fs.createWriteStream(target)
  let received = 0
  req.on('data', (chunk) => {
    received += chunk.length
    if (received > VIDEO_MAX_BYTES) req.destroy()
  })
  req.pipe(out)
  out.on('finish', () => res.json({ url: `/uploads/videos/${name}` }))
  req.on('error', () => {
    out.destroy()
    fs.rmSync(target, { force: true })
  })
})

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'غير موجود' })
})

if (isProd) {
  const dist = path.join(__dirname, '..', 'dist')
  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    const file = path.join(dist, 'index.html')
    if (fs.existsSync(file)) res.sendFile(file)
    else next()
  })
}

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'حجم الصورة أكبر من الحد المسموح' })
  const status = error.status || 500
  if (status === 500) console.error(error)
  res.status(status).json({ error: status === 500 ? 'خطأ في الخادم' : error.message })
})

export default app

if (!process.env.VERCEL && process.env.BLUE_HOME_LISTEN !== '0' && !isCloud()) {
  const port = process.env.PORT || 3001
  const server = app.listen(port, () => {
    console.log(`Blue Home API http://127.0.0.1:${port}`)
  })
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') console.error('المنفذ 3001 مستخدم')
    else console.error(error)
    process.exit(1)
  })
}
