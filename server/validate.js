import { PROPERTY_TYPES, ROOM_TYPES, OPERATIONS, PAYMENTS, STATUSES, REQUEST_TYPES, latinDigits } from '../shared/constants.js'

const ROOM = new Set(ROOM_TYPES)
const OPS = new Set(OPERATIONS.map((item) => item.id))
const PAY = new Set(PAYMENTS.map((item) => item.id))
const STATUS = new Set(STATUSES.map((item) => item.id))
const REQUESTS = new Set(REQUEST_TYPES.map((item) => item.id))

function fail(error) {
  return { error }
}

function onlyKnown(body, keys) {
  const out = {}
  if (!body || typeof body !== 'object') return out
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key]
  }
  return out
}

function text(value, max) {
  return String(value ?? '').trim().slice(0, max)
}

function requiredText(value, label, max) {
  const clean = text(value, max)
  if (!clean) return fail(`${label} مطلوب`)
  return { value: clean }
}

function optionalNumber(value, label, { integer = false, max = 1e12 } = {}) {
  if (value === '' || value == null) return { value: null }
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(n) || n < 0 || n > max) return fail(`${label} رقم غير صالح`)
  if (integer && !Number.isInteger(n)) return fail(`${label} لازم يكون رقمًا صحيحًا`)
  return { value: n }
}

function httpsOrEmpty(value, label) {
  const clean = text(value, 400)
  if (!clean) return { value: '' }
  try {
    const url = new URL(clean)
    if (url.protocol !== 'https:') return fail(`${label} لازم يبدأ بـ https`)
  } catch {
    return fail(`${label} رابط غير صالح`)
  }
  return { value: clean }
}

export const VIDEO_PATH = /^\/uploads\/videos\/[a-f0-9]{16}\.(mp4|mov|webm|m4v)$/

// Either a link (YouTube, mp4) or a video the admin uploaded to /uploads/videos/.
function videoOrEmpty(value, label) {
  const clean = text(value, 400)
  if (VIDEO_PATH.test(clean)) return { value: clean }
  return httpsOrEmpty(clean, label)
}

function featuresOf(value) {
  const list = Array.isArray(value) ? value : String(value || '').split('\n')
  return list.map((item) => text(item, 80)).filter(Boolean).slice(0, 30)
}

function imagesOf(value) {
  if (value == null) return { value: [] }
  if (!Array.isArray(value)) return fail('قائمة الصور غير صالحة')
  if (value.length > 12) return fail('الحد الأقصى 12 صورة')
  const images = []
  for (const raw of value) {
    const url = text(raw, 500)
    if (!url) continue
    if (url.startsWith('/uploads/')) {
      if (!/^\/uploads\/[a-zA-Z0-9._-]+$/.test(url)) return fail('مسار صورة غير صالح')
      images.push(url)
    } else if (/^https:\/\/.{3,}/.test(url)) images.push(url)
    else return fail('استخدم صورة مرفوعة أو رابط https')
  }
  return { value: images }
}

function coord(value, min, max, label) {
  if (value === '' || value == null) return { value: null }
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) return fail(label)
  return { value: n }
}

const PROJECT_KEYS = ['name', 'developer', 'areaId', 'address', 'description', 'features', 'lat', 'lng', 'videoUrl', 'virtualTourUrl', 'images', 'published', 'featured', 'isSample']
const LISTING_KEYS = ['title', 'description', 'type', 'operation', 'areaId', 'projectId', 'address', 'price', 'areaSqm', 'rooms', 'baths', 'paymentType', 'downPayment', 'installmentAmount', 'installmentMonths', 'paymentNote', 'status', 'lat', 'lng', 'videoUrl', 'virtualTourUrl', 'features', 'images', 'published', 'featured', 'isOffer', 'isSample']

export function parseProject(body, db, current) {
  const merged = {
    developer: '',
    address: '',
    description: '',
    features: [],
    images: [],
    videoUrl: '',
    virtualTourUrl: '',
    published: true,
    featured: false,
    isSample: false,
    ...(current || {}),
    ...onlyKnown(body, PROJECT_KEYS),
  }
  const name = requiredText(merged.name, 'اسم المشروع', 120)
  if (name.error) return name
  if (!db.areas.some((area) => area.id === merged.areaId)) return fail('اختر منطقة صحيحة')
  const lat = coord(merged.lat, -90, 90, 'خط العرض غير صالح')
  if (lat.error) return lat
  const lng = coord(merged.lng, -180, 180, 'خط الطول غير صالح')
  if (lng.error) return lng
  if ((lat.value == null) !== (lng.value == null)) return fail('أدخل خطي الطول والعرض معًا أو اتركهما فارغين')
  const images = imagesOf(merged.images)
  if (images.error) return images
  const videoUrl = videoOrEmpty(merged.videoUrl, 'رابط الفيديو')
  if (videoUrl.error) return videoUrl
  const tour = httpsOrEmpty(merged.virtualTourUrl, 'رابط الجولة')
  if (tour.error) return tour
  const now = new Date().toISOString()
  return {
    value: {
      id: current?.id || crypto.randomUUID(),
      name: name.value,
      developer: text(merged.developer, 120),
      areaId: merged.areaId,
      address: text(merged.address, 180),
      description: text(merged.description, 8000),
      features: featuresOf(merged.features),
      lat: lat.value,
      lng: lng.value,
      videoUrl: videoUrl.value,
      virtualTourUrl: tour.value,
      images: images.value,
      published: Boolean(merged.published),
      featured: Boolean(merged.featured),
      isSample: Boolean(merged.isSample),
      createdAt: current?.createdAt || now,
      updatedAt: now,
    },
  }
}

export function parseListing(body, db, current) {
  const merged = {
    description: '',
    address: '',
    projectId: '',
    paymentType: 'cash',
    paymentNote: '',
    status: 'available',
    operation: 'sale',
    features: [],
    images: [],
    videoUrl: '',
    virtualTourUrl: '',
    published: true,
    featured: false,
    isOffer: false,
    isSample: false,
    ...(current || {}),
    ...onlyKnown(body, LISTING_KEYS),
  }
  const title = requiredText(merged.title, 'عنوان الإعلان', 140)
  if (title.error) return title
  if (!PROPERTY_TYPES.includes(merged.type)) return fail('نوع العقار غير صالح')
  if (!OPS.has(merged.operation)) return fail('نوع العملية غير صالح')
  if (!PAY.has(merged.paymentType)) return fail('نظام السداد غير صالح')
  if (!STATUS.has(merged.status)) return fail('حالة العقار غير صالحة')
  if (!db.areas.some((area) => area.id === merged.areaId)) return fail('اختر منطقة صحيحة')
  const projectId = text(merged.projectId, 80)
  if (projectId) {
    const project = db.projects.find((item) => item.id === projectId)
    if (!project) return fail('المشروع المختار غير موجود')
    if (project.areaId !== merged.areaId) return fail('منطقة الإعلان لازم تطابق منطقة المشروع')
  }
  const price = optionalNumber(merged.price, 'السعر')
  if (price.error) return price
  const areaSqm = optionalNumber(merged.areaSqm, 'المساحة', { max: 10000000 })
  if (areaSqm.error) return areaSqm
  const rooms = optionalNumber(merged.rooms, 'الغرف', { integer: true, max: 20 })
  if (rooms.error) return rooms
  const baths = optionalNumber(merged.baths, 'الحمامات', { integer: true, max: 20 })
  if (baths.error) return baths
  const down = optionalNumber(merged.downPayment, 'المقدم')
  if (down.error) return down
  const installment = optionalNumber(merged.installmentAmount, 'القسط')
  if (installment.error) return installment
  const months = optionalNumber(merged.installmentMonths, 'مدة التقسيط', { integer: true, max: 360 })
  if (months.error) return months
  const lat = coord(merged.lat, -90, 90, 'خط العرض غير صالح')
  if (lat.error) return lat
  const lng = coord(merged.lng, -180, 180, 'خط الطول غير صالح')
  if (lng.error) return lng
  if ((lat.value == null) !== (lng.value == null)) return fail('أدخل خطي الطول والعرض معًا أو اتركهما فارغين')
  const images = imagesOf(merged.images)
  if (images.error) return images
  const videoUrl = videoOrEmpty(merged.videoUrl, 'رابط الفيديو')
  if (videoUrl.error) return videoUrl
  const tour = httpsOrEmpty(merged.virtualTourUrl, 'رابط الجولة')
  if (tour.error) return tour
  const residential = ROOM.has(merged.type)
  const now = new Date().toISOString()
  return {
    value: {
      id: current?.id || crypto.randomUUID(),
      title: title.value,
      description: text(merged.description, 8000),
      type: merged.type,
      operation: merged.operation,
      areaId: merged.areaId,
      projectId,
      address: text(merged.address, 180),
      price: price.value,
      areaSqm: areaSqm.value,
      rooms: residential ? rooms.value : null,
      baths: residential ? baths.value : null,
      paymentType: merged.paymentType,
      downPayment: down.value,
      installmentAmount: installment.value,
      installmentMonths: months.value,
      paymentNote: text(merged.paymentNote, 300),
      status: merged.status,
      lat: lat.value,
      lng: lng.value,
      videoUrl: videoUrl.value,
      virtualTourUrl: tour.value,
      features: featuresOf(merged.features),
      images: images.value,
      published: Boolean(merged.published),
      featured: Boolean(merged.featured),
      isOffer: Boolean(merged.isOffer),
      isSample: Boolean(merged.isSample),
      createdAt: current?.createdAt || now,
      updatedAt: now,
    },
  }
}

export function parseArea(body, db, current) {
  const name = requiredText(body?.name, 'اسم المنطقة', 80)
  if (name.error) return name
  const duplicate = db.areas.some((area) => area.name === name.value && area.id !== current?.id)
  if (duplicate) return fail('المنطقة موجودة بالفعل')
  return {
    value: {
      id: current?.id || `area-${crypto.randomUUID().slice(0, 8)}`,
      name: name.value,
      createdAt: current?.createdAt || new Date().toISOString(),
    },
  }
}

function emailOrEmpty(value) {
  const clean = text(value, 120)
  if (!clean) return { value: '' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return fail('البريد الإلكتروني غير صالح')
  return { value: clean }
}

function phoneOrEmpty(value, label) {
  const clean = text(latinDigits(value), 30)
  if (!clean) return { value: '' }
  const digits = clean.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return fail(`${label} غير صالح`)
  return { value: clean }
}

export function parseSettings(body, current) {
  const facebook = httpsOrEmpty(body?.facebook, 'فيسبوك')
  if (facebook.error) return facebook
  const instagram = httpsOrEmpty(body?.instagram, 'إنستغرام')
  if (instagram.error) return instagram
  const youtube = httpsOrEmpty(body?.youtube, 'يوتيوب')
  if (youtube.error) return youtube
  const email = emailOrEmpty(body?.email)
  if (email.error) return email
  const phone = phoneOrEmpty(body?.phone, 'رقم الهاتف')
  if (phone.error) return phone
  const whatsapp = phoneOrEmpty(body?.whatsapp, 'رقم واتساب')
  if (whatsapp.error) return whatsapp
  const siteName = text(body?.siteName, 40) || 'بلو هوم'
  return {
    value: {
      ...current,
      siteName,
      siteNameEn: text(body?.siteNameEn, 40) || 'Blue Home',
      phone: phone.value,
      whatsapp: whatsapp.value,
      email: email.value,
      address: text(body?.address, 180),
      facebook: facebook.value,
      instagram: instagram.value,
      youtube: youtube.value,
      about: text(body?.about, 5000),
    },
  }
}

export function parseTestimonial(body, current) {
  const name = requiredText(body?.name, 'اسم العميل', 80)
  if (name.error) return name
  const quote = requiredText(body?.text, 'نص الرأي', 600)
  if (quote.error) return quote
  const published = Boolean(body?.published)
  const confirmed = Boolean(body?.confirmed)
  if (published && !confirmed) return fail('لا يُنشر الرأي إلا بعد تأكيد أنه حقيقي وموافق على نشره')
  const now = new Date().toISOString()
  return {
    value: {
      id: current?.id || crypto.randomUUID(),
      name: name.value,
      place: text(body?.place, 80),
      text: quote.value,
      confirmed,
      published,
      createdAt: current?.createdAt || now,
      updatedAt: now,
    },
  }
}

export function parseInquiry(body) {
  if (text(body?.company, 80)) return { value: { spam: true } }
  const name = requiredText(body?.name, 'الاسم', 80)
  if (name.error) return name
  const phone = phoneOrEmpty(body?.phone, 'رقم الهاتف')
  if (phone.error || !phone.value) return fail('رقم الهاتف مطلوب')
  const message = requiredText(body?.message, 'الرسالة', 2000)
  if (message.error) return message
  const requestType = REQUESTS.has(body?.requestType) ? body.requestType : 'contact'
  return {
    value: {
      id: crypto.randomUUID(),
      name: name.value,
      phone: phone.value,
      message: message.value,
      requestType,
      listingId: text(body?.listingId, 80),
      projectId: text(body?.projectId, 80),
      createdAt: new Date().toISOString(),
      read: false,
    },
  }
}
