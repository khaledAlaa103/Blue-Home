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

export function customerRows(db, now = new Date()) {
  const accounts = (db.users || [])
    .filter((user) => roleOf(user) !== 'admin' && isCurrent(user.createdAt, now))
    .map((user) => ({
      id: `user-${user.id}`,
      name: nameOf(user),
      phone: user.phone || '',
      source: 'signup',
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
        detail: [about, item.message || ''].filter(Boolean).join(' — '),
        createdAt: item.createdAt || '',
        expiresAt: expiresOn(item.createdAt),
      }
    })
  return [...accounts, ...requests].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}
