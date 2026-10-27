import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { enforceCustomerLimits } from './customers.js'

const __dirname = (() => {
  try {
    return import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : '/tmp'
  } catch {
    return '/tmp'
  }
})()
const writableRoot = process.env.VERCEL ? '/tmp' : __dirname
export const dbFile = path.join(writableRoot, process.env.VERCEL ? 'blue-home-data.json' : 'data.json')
export const uploadDir = path.join(writableRoot, process.env.VERCEL ? 'blue-home-uploads' : 'uploads')

const ADMIN_USERNAME = 'admin'

function adminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD
  if (isCloud()) return ''
  return 'MaiBlue'
}

export function isCloud() {
  return process.env.BLUE_HOME_CLOUD === '1' || typeof WebSocketPair !== 'undefined'
}

export function hashPassword(password) {
  if (isCloud()) {
    return `sha256:${crypto.createHash('sha256').update(`blue-home|${password}`).digest('hex')}`
  }
  return bcrypt.hashSync(password, 10)
}

export function passwordMatches(hash, password) {
  const stored = String(hash || '')
  if (!stored) return false
  if (stored.startsWith('sha256:')) {
    return stored === `sha256:${crypto.createHash('sha256').update(`blue-home|${password}`).digest('hex')}`
  }
  try {
    return bcrypt.compareSync(password, stored)
  } catch {
    return false
  }
}

const photos = {
  villa: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=70',
  house: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=70',
  modern: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=70',
  apt: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=70',
  interior: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=70',
  land: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=70',
  land2: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=70',
  shop: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=70',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=70',
  tower: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=70',
}

function stamp(day, hour = 10) {
  return new Date(Date.UTC(2026, 9, day, hour, 0, 0)).toISOString()
}

function createSeed() {
  const areas = [
    { id: 'october', name: '6 أكتوبر', createdAt: stamp(1) },
    { id: 'zayed', name: 'الشيخ زايد', createdAt: stamp(1, 11) },
    { id: 'new-october', name: 'أكتوبر الجديدة', createdAt: stamp(1, 12) },
  ]
  const projects = [
    {
      id: 'p1',
      name: 'بلو ريزيدنس',
      developer: 'مطور تجريبي',
      areaId: 'october',
      address: 'حي تجريبي، 6 أكتوبر',
      description: 'مشروع تجريبي لتجربة عرض الكمبوند داخل المنصة. البيانات والأسعار غير حقيقية ويمكن حذفها من لوحة التحكم.',
      features: ['بوابة رئيسية', 'منطقة خضراء داخل المخطط التجريبي'],
      lat: 29.952,
      lng: 30.921,
      videoUrl: '',
      virtualTourUrl: '',
      images: [photos.tower, photos.modern, photos.interior],
      published: true,
      featured: true,
      isSample: true,
      createdAt: stamp(10),
      updatedAt: stamp(10),
    },
    {
      id: 'p2',
      name: 'حدائق الزاوية',
      developer: 'مطور تجريبي',
      areaId: 'zayed',
      address: 'حي تجريبي، الشيخ زايد',
      description: 'مشروع تجريبي في الشيخ زايد لتجربة صفحة المشروع والوحدات المرتبطة به.',
      features: ['مداخل منفصلة في المخطط التجريبي'],
      lat: 30.031,
      lng: 30.978,
      videoUrl: '',
      virtualTourUrl: '',
      images: [photos.villa, photos.house],
      published: true,
      featured: true,
      isSample: true,
      createdAt: stamp(12),
      updatedAt: stamp(12),
    },
    {
      id: 'p3',
      name: 'هضبة أكتوبر',
      developer: 'مطور تجريبي',
      areaId: 'new-october',
      address: 'حي تجريبي، أكتوبر الجديدة',
      description: 'مشروع تجريبي في أكتوبر الجديدة. الإحداثيات على مستوى المنطقة وليست موقعًا مؤكدًا.',
      features: [],
      lat: 29.907,
      lng: 30.892,
      videoUrl: '',
      virtualTourUrl: '',
      images: [photos.house],
      published: true,
      featured: false,
      isSample: true,
      createdAt: stamp(14),
      updatedAt: stamp(14),
    },
  ]
  const sample = 'إعلان تجريبي لتجربة البحث والعرض. الأرقام غير حقيقية.'
  const listings = [
    listing({ id: 'l1', title: 'شقة تجريبية 3 غرف في بلو ريزيدنس', type: 'شقة', operation: 'sale', areaId: 'october', projectId: 'p1', price: 4800000, areaSqm: 165, rooms: 3, baths: 2, paymentType: 'installment', downPayment: 480000, installmentAmount: 62000, installmentMonths: 84, status: 'available', featured: true, isOffer: true, images: [photos.apt, photos.interior], lat: 29.952, lng: 30.921, address: 'حي تجريبي، 6 أكتوبر', description: sample, createdAt: stamp(25) }),
    listing({ id: 'l2', title: 'فيلا تجريبية في حدائق الزاوية', type: 'فيلا', operation: 'sale', areaId: 'zayed', projectId: 'p2', price: 18500000, areaSqm: 420, rooms: 5, baths: 6, paymentType: 'cash', status: 'available', featured: true, images: [photos.villa, photos.house], lat: 30.031, lng: 30.978, address: 'حي تجريبي، الشيخ زايد', description: sample, createdAt: stamp(24) }),
    listing({ id: 'l3', title: 'تاون هاوس تجريبي في هضبة أكتوبر', type: 'تاون هاوس', operation: 'sale', areaId: 'new-october', projectId: 'p3', price: 8900000, areaSqm: 240, rooms: 4, baths: 4, paymentType: 'both', downPayment: 900000, installmentAmount: 75000, installmentMonths: 72, status: 'available', isOffer: true, images: [photos.modern], address: 'حي تجريبي، أكتوبر الجديدة', description: sample, createdAt: stamp(23) }),
    listing({ id: 'l4', title: 'توين هاوس تجريبي للاستثمار', type: 'توين هاوس', operation: 'investment', areaId: 'october', projectId: 'p1', price: 7200000, areaSqm: 210, rooms: 3, baths: 3, paymentType: 'cash', status: 'available', images: [photos.house], description: sample, createdAt: stamp(22) }),
    listing({ id: 'l5', title: 'أرض سكنية تجريبية في الشيخ زايد', type: 'أرض', operation: 'sale', areaId: 'zayed', price: 6500000, areaSqm: 600, paymentType: 'cash', status: 'available', images: [photos.land], description: sample, createdAt: stamp(21) }),
    listing({ id: 'l6', title: 'أرض استثمارية تجريبية في أكتوبر الجديدة', type: 'أرض', operation: 'investment', areaId: 'new-october', price: 3200000, areaSqm: 450, paymentType: 'installment', downPayment: 500000, installmentAmount: 40000, installmentMonths: 36, status: 'reserved', images: [photos.land2], description: sample, createdAt: stamp(20) }),
    listing({ id: 'l7', title: 'محل تجاري تجريبي في الشيخ زايد', type: 'محل تجاري', operation: 'sale', areaId: 'zayed', projectId: 'p2', price: 4300000, areaSqm: 80, paymentType: 'cash', status: 'available', images: [photos.shop], description: sample, createdAt: stamp(19) }),
    listing({ id: 'l8', title: 'مكتب إداري تجريبي في 6 أكتوبر', type: 'إداري', operation: 'sale', areaId: 'october', projectId: 'p1', price: 5600000, areaSqm: 120, paymentType: 'installment', downPayment: 700000, installmentAmount: 48000, installmentMonths: 60, status: 'sold', images: [photos.office], description: sample, createdAt: stamp(18) }),
  ]
  return {
    jwtSecret: crypto.randomBytes(32).toString('hex'),
    users: [
      {
        id: 'admin',
        username: ADMIN_USERNAME,
        passwordHash: adminPassword() ? hashPassword(adminPassword()) : 'sha256:disabled',
        role: 'admin',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        mustChangePassword: false,
      },
    ],
    settings: {
      siteName: 'بلو هوم',
      siteNameEn: 'Blue Home',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      facebook: '',
      instagram: '',
      youtube: '',
      about: '',
    },
    areas,
    projects,
    listings,
    inquiries: [],
    testimonials: [],
  }
}

function listing(partial) {
  return {
    projectId: '',
    address: '',
    description: '',
    price: null,
    areaSqm: null,
    rooms: null,
    baths: null,
    paymentType: 'cash',
    downPayment: null,
    installmentAmount: null,
    installmentMonths: null,
    paymentNote: '',
    status: 'available',
    operation: 'sale',
    lat: null,
    lng: null,
    videoUrl: '',
    virtualTourUrl: '',
    features: [],
    images: [],
    published: true,
    featured: false,
    isOffer: false,
    isSample: true,
    updatedAt: partial.createdAt,
    ...partial,
  }
}

let memoryDb = null
let kvBinding = null
let pendingWrite = null

export function bindKv(binding) {
  kvBinding = binding || null
}

export async function hydrateFromKv() {
  if (!isCloud()) return
  if (!kvBinding) {
    if (!memoryDb) memoryDb = createSeed()
    return
  }
  const text = await kvBinding.get('blue-home-db')
  if (text) {
    memoryDb = JSON.parse(text)
    return
  }
  if (!memoryDb) memoryDb = createSeed()
  await kvBinding.put('blue-home-db', JSON.stringify(memoryDb))
}

export function ensureDb() {
  if (isCloud()) {
    if (!memoryDb) memoryDb = createSeed()
    return
  }
  fs.mkdirSync(uploadDir, { recursive: true })
  if (!fs.existsSync(dbFile)) writeDb(createSeed())
}

export function readDb() {
  if (isCloud()) {
    if (!memoryDb) memoryDb = createSeed()
    return memoryDb
  }
  ensureDb()
  return JSON.parse(fs.readFileSync(dbFile, 'utf8'))
}

export function writeDb(db) {
  if (isCloud()) {
    memoryDb = db
    if (kvBinding) pendingWrite = kvBinding.put('blue-home-db', JSON.stringify(db))
    return
  }
  fs.mkdirSync(uploadDir, { recursive: true })
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2))
}

let queue = Promise.resolve()
export function mutate(fn) {
  const run = queue.then(async () => {
    const db = readDb()
    const result = await fn(db)
    enforceCustomerLimits(db)
    writeDb(db)
    if (pendingWrite) {
      const write = pendingWrite
      pendingWrite = null
      await write
    }
    return result
  })
  queue = run.then(() => undefined, () => undefined)
  return run
}

export function enrichListing(db, item) {
  const area = db.areas.find((entry) => entry.id === item.areaId)
  const project = item.projectId ? db.projects.find((entry) => entry.id === item.projectId) : null
  const pricePerMeter = item.price != null && item.areaSqm ? Math.round(item.price / item.areaSqm) : null
  return {
    ...item,
    areaName: area?.name || '',
    projectName: project?.name || '',
    projectPublished: Boolean(project?.published),
    developer: project?.developer || '',
    pricePerMeter,
  }
}

export function enrichProject(db, project, { admin = false } = {}) {
  const area = db.areas.find((entry) => entry.id === project.areaId)
  const listings = db.listings.filter((item) => item.projectId === project.id && (admin || item.published))
  return { ...project, areaName: area?.name || '', listingCount: listings.length }
}

export function publicSettings(settings) {
  return {
    siteName: settings.siteName || 'بلو هوم',
    siteNameEn: settings.siteNameEn || 'Blue Home',
    phone: settings.phone || '',
    whatsapp: settings.whatsapp || '',
    email: settings.email || '',
    address: settings.address || '',
    facebook: settings.facebook || '',
    instagram: settings.instagram || '',
    youtube: settings.youtube || '',
    about: settings.about || '',
  }
}

export function forgetImages(db, images) {
  if (isCloud()) return
  for (const url of images || []) {
    if (!String(url).startsWith('/uploads/')) continue
    const used = [...db.projects, ...db.listings].some((item) => (item.images || []).includes(url))
    if (used) continue
    const name = path.basename(url)
    if (!/^[\w.-]+$/.test(name)) continue
    fs.rmSync(path.join(uploadDir, name), { force: true })
  }
}
