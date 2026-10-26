function num(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function nullsLast(a, b, dir) {
  const left = num(a)
  const right = num(b)
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  if (left === right) return 0
  return left < right ? -dir : dir
}

export function applyFilters(items, query = {}) {
  const q = query || {}
  const minPrice = num(q.minPrice)
  const maxPrice = num(q.maxPrice)
  const minArea = num(q.minArea)
  const maxArea = num(q.maxArea)
  const rooms = num(q.rooms)
  const baths = num(q.baths)
  const minDown = num(q.minDown)
  const maxDown = num(q.maxDown)
  const maxMonths = num(q.maxMonths)
  const projectText = String(q.project || '').trim()
  const keyword = String(q.q || '').trim()

  const out = items.filter((item) => {
    if (q.publishedOnly && !item.published) return false
    if (q.group === 'lands' && item.type !== 'أرض') return false
    if (q.group === 'units' && item.type === 'أرض') return false
    if (q.areaId && item.areaId !== q.areaId) return false
    if (q.type && item.type !== q.type) return false
    if (q.operation && item.operation !== q.operation) return false
    if (q.projectId && item.projectId !== q.projectId) return false
    if (q.status && item.status !== q.status) return false
    if (String(q.offers) === '1') {
      const offer = item.isOffer || item.paymentType === 'installment' || item.paymentType === 'both' || item.operation === 'investment'
      if (!offer || item.status !== 'available') return false
    }
    const price = num(item.price)
    const area = num(item.areaSqm)
    if (minPrice != null && (price == null || price < minPrice)) return false
    if (maxPrice != null && (price == null || price > maxPrice)) return false
    if (minArea != null && (area == null || area < minArea)) return false
    if (maxArea != null && (area == null || area > maxArea)) return false
    if (rooms != null && (item.rooms == null || Number(item.rooms) < rooms)) return false
    if (baths != null && (item.baths == null || Number(item.baths) < baths)) return false
    if (q.payment === 'cash' && item.paymentType !== 'cash' && item.paymentType !== 'both') return false
    if (q.payment === 'installment' && item.paymentType !== 'installment' && item.paymentType !== 'both') return false
    if (minDown != null && (item.downPayment == null || Number(item.downPayment) < minDown)) return false
    if (maxDown != null && (item.downPayment == null || Number(item.downPayment) > maxDown)) return false
    if (maxMonths != null && (item.installmentMonths == null || Number(item.installmentMonths) > maxMonths)) return false
    if (projectText && !`${item.projectName || ''} ${item.title || ''}`.includes(projectText)) return false
    if (keyword) {
      const blob = `${item.title || ''} ${item.description || ''} ${item.areaName || ''} ${item.projectName || ''} ${item.address || ''}`
      if (!blob.includes(keyword)) return false
    }
    return true
  })

  const sort = q.sort || 'newest'
  out.sort((a, b) => {
    let diff = 0
    if (sort === 'price_asc') diff = nullsLast(a.price, b.price, 1)
    else if (sort === 'price_desc') diff = nullsLast(a.price, b.price, -1)
    else if (sort === 'area_asc') diff = nullsLast(a.areaSqm, b.areaSqm, 1)
    else if (sort === 'area_desc') diff = nullsLast(a.areaSqm, b.areaSqm, -1)
    else diff = String(b.createdAt).localeCompare(String(a.createdAt))
    if (diff === 0 && sort !== 'newest') diff = String(b.createdAt).localeCompare(String(a.createdAt))
    return diff
  })
  return out
}

export function paginate(items, query = {}) {
  const pageSize = Math.min(48, Math.max(1, Number(query.pageSize) || 12))
  const pages = Math.max(1, Math.ceil(items.length / pageSize) || 1)
  const page = Math.min(pages, Math.max(1, Number(query.page) || 1))
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length, page, pages }
}

export function similarTo(items, item, limit = 3) {
  return items
    .filter((entry) => entry.published && entry.id !== item.id && entry.areaId === item.areaId && entry.status !== 'sold')
    .sort((a, b) => Number(b.type === item.type) - Number(a.type === item.type) || String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit)
}
