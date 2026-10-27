export const USER_LIMIT = 10000
export const RETENTION_YEARS = 2

function roleOf(user) {
  if (user?.role === 'admin' || user?.role === 'user') return user.role
  return user?.username === 'admin' ? 'admin' : 'user'
}

function nameOf(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || ''
}

export function retentionCutoff(now = new Date()) {
  const cutoff = new Date(now)
  cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS)
  return cutoff.toISOString()
}

export function expiresOn(createdAt) {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  date.setFullYear(date.getFullYear() + RETENTION_YEARS)
  return date.toISOString()
}

export function isCurrent(createdAt, now = new Date()) {
  if (!createdAt) return true
  return createdAt >= retentionCutoff(now)
}

export function accountExpired(user, now = new Date()) {
  if (!user || roleOf(user) === 'admin' || !user.createdAt) return false
  return !isCurrent(user.createdAt, now)
}

export function pruneCustomers(db, now = new Date()) {
  const users = db.users || []
  const inquiries = db.inquiries || []
  const nextUsers = users.filter((user) => roleOf(user) === 'admin' || isCurrent(user.createdAt, now))
  const nextInquiries = inquiries.filter((item) => isCurrent(item.createdAt, now))
  const changed = nextUsers.length !== users.length || nextInquiries.length !== inquiries.length
  if (changed) {
    db.users = nextUsers
    db.inquiries = nextInquiries
  }
  return changed
}

export function signupCount(db, now = new Date()) {
  return (db.users || []).filter((user) => roleOf(user) !== 'admin' && isCurrent(user.createdAt, now)).length
}

function keepNewest(items, limit) {
  if (items.length <= limit) return items
  return [...items]
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .slice(items.length - limit)
}

export function enforceCustomerLimits(db, now = new Date()) {
  pruneCustomers(db, now)
  const admins = (db.users || []).filter((user) => roleOf(user) === 'admin')
  db.users = [...admins, ...keepNewest((db.users || []).filter((user) => roleOf(user) !== 'admin'), USER_LIMIT)]
  db.inquiries = keepNewest(db.inquiries || [], USER_LIMIT)
}

export const BLOCKED_ACCOUNT = 'الحساب ده موقوف. تواصل مع بلو هوم.'
export const BLOCKED_PHONE = 'لا يمكن التسجيل أو الإرسال بهذه البيانات. تواصل مع بلو هوم.'

// 01x, 201x, +201x and 00201x are the same Egyptian mobile.
export function phoneKey(phone) {
  return String(phone || '').replace(/\D/g, '').replace(/^(00)?20(?=1\d{9}$)/, '0')
}

// Names and addresses match however the hamza, taa marbuta, alef maqsura, case or spacing were typed.
export function textKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

// What a person typed at Sign up (or in a request) that a block remembers.
function identityOf(record) {
  return {
    phone: phoneKey(record?.phone),
    username: String(record?.username || '').trim().toLowerCase(),
    name: textKey([record?.firstName, record?.lastName].filter(Boolean).join(' ') || record?.name),
    address: textKey(record?.address),
  }
}

// Blocked if any one field matches any block, so changing the phone alone (or the username alone) doesn't get back in.
export function isBlocked(db, record) {
  const who = identityOf(record)
  return (db.blocked || []).some((entry) => ['phone', 'username', 'name', 'address'].some((field) => entry[field] && entry[field] === who[field]))
}

function recordOf(db, rowId) {
  const id = String(rowId || '')
  if (id.startsWith('user-')) return (db.users || []).find((user) => user.id === id.slice(5) && roleOf(user) !== 'admin')
  if (id.startsWith('inquiry-')) return (db.inquiries || []).find((item) => item.id === id.slice(8))
  return null
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Block (or unblock) the person behind a customers row; unblocking also clears any block that matches them.
export function setRowBlocked(db, rowId, blocked, now = new Date()) {
  const record = recordOf(db, rowId)
  if (!record) return false
  if (!blocked) {
    db.blocked = (db.blocked || []).filter((entry) => !isBlocked({ blocked: [entry] }, record))
    return true
  }
  if (isBlocked(db, record)) return true
  const who = identityOf(record)
  ;(db.blocked ||= []).unshift({
    id: randomKey(),
    ...who,
    label: nameOf(record) || record.name || '',
    phoneShown: record.phone || '',
    usernameShown: record.username || '',
    createdAt: now.toISOString(),
  })
  return true
}

export function unblockEntry(db, entryId) {
  const before = (db.blocked || []).length
  db.blocked = (db.blocked || []).filter((entry) => entry.id !== entryId)
  return db.blocked.length !== before
}

// Row ids from customerRows: "user-<id>" (Sign up) or "inquiry-<id>" (request).
export function deleteCustomer(db, rowId) {
  const id = String(rowId || '')
  if (id.startsWith('user-')) {
    const userId = id.slice(5)
    const before = (db.users || []).length
    db.users = (db.users || []).filter((user) => user.id !== userId || roleOf(user) === 'admin')
    return db.users.length !== before
  }
  if (id.startsWith('inquiry-')) {
    const inquiryId = id.slice(8)
    const before = (db.inquiries || []).length
    db.inquiries = (db.inquiries || []).filter((item) => item.id !== inquiryId)
    return db.inquiries.length !== before
  }
  return false
}

export function customerRows(db, now = new Date()) {
  const accounts = (db.users || [])
    .filter((user) => roleOf(user) !== 'admin' && isCurrent(user.createdAt, now))
    .map((user) => ({
      id: `user-${user.id}`,
      name: nameOf(user),
      phone: user.phone || '',
      source: 'signup',
      blocked: isBlocked(db, user),
      detail: [user.username ? `اسم المستخدم: ${user.username}` : '', user.address || ''].filter(Boolean).join(' · '),
      createdAt: user.createdAt || '',
      expiresAt: expiresOn(user.createdAt),
    }))
  const requests = (db.inquiries || [])
    .filter((item) => isCurrent(item.createdAt, now))
    .map((item) => {
      const listing = (db.listings || []).find((entry) => entry.id === item.listingId)
      const project = (db.projects || []).find((entry) => entry.id === item.projectId)
      const about = [listing?.title, project?.name].filter(Boolean).join(' · ')
      return {
        id: `inquiry-${item.id}`,
        name: item.name || '',
        phone: item.phone || '',
        source: 'request',
        blocked: isBlocked(db, item),
        detail: [about, item.message || ''].filter(Boolean).join(' — '),
        createdAt: item.createdAt || '',
        expiresAt: expiresOn(item.createdAt),
      }
    })
  return [...accounts, ...requests].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}
