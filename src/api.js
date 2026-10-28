const TOKEN_KEY = 'bluehome_token'
export const AUTH_EVENT = 'bluehome-auth'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

async function request(path, { method = 'GET', body, form } = {}) {
  if (import.meta.env.VITE_STATIC === '1') {
    const { staticRequest } = await import('./staticApi.js')
    return staticRequest(path, { method, body, form })
  }
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body != null) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  let response
  try {
    response = await fetch(path, { method, headers, body: payload })
  } catch {
    const error = new Error('تعذر الاتصال بالخادم')
    error.status = 0
    throw error
  }
  const data = await response.json().catch(() => ({}))
  if (response.status === 401 && !path.endsWith('/login')) setToken(null)
  if (!response.ok) {
    const error = new Error(data.error || 'حدث خطأ')
    error.status = response.status
    error.code = data.code
    throw error
  }
  return data
}

function query(path, params) {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== '' && value != null) search.set(key, value)
  })
  const text = search.toString()
  return request(text ? `${path}?${text}` : path)
}

export const api = {
  login: (username, password) => request('/api/auth/login', { method: 'POST', body: { username, password } }),
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  me: async () => {
    if (!getToken()) return null
    try {
      return await request('/api/auth/me')
    } catch (error) {
      if (error.status === 401) return null
      throw error
    }
  },
  bootstrap: () => request('/api/bootstrap'),
  home: () => request('/api/home'),
  projects: (params) => query('/api/projects', params),
  project: (id, preview) => request(`/api/projects/${id}${preview ? '?preview=1' : ''}`),
  listings: (params) => query('/api/listings', params),
  listing: (id, preview) => request(`/api/listings/${id}${preview ? '?preview=1' : ''}`),
  similar: (id) => request(`/api/listings/${id}/similar`),
  inquire: (body) => request('/api/inquiries', { method: 'POST', body }),
  summary: () => request('/api/admin/summary'),
  adminProjects: () => request('/api/admin/projects'),
  saveProject: (body, id) => request(id ? `/api/admin/projects/${id}` : '/api/admin/projects', { method: id ? 'PUT' : 'POST', body }),
  deleteProject: (id) => request(`/api/admin/projects/${id}`, { method: 'DELETE' }),
  adminListings: () => request('/api/admin/listings'),
  saveListing: (body, id) => request(id ? `/api/admin/listings/${id}` : '/api/admin/listings', { method: id ? 'PUT' : 'POST', body }),
  deleteListing: (id) => request(`/api/admin/listings/${id}`, { method: 'DELETE' }),
  adminAreas: () => request('/api/admin/areas'),
  saveArea: (body, id) => request(id ? `/api/admin/areas/${id}` : '/api/admin/areas', { method: id ? 'PUT' : 'POST', body }),
  deleteArea: (id) => request(`/api/admin/areas/${id}`, { method: 'DELETE' }),
  customers: () => request('/api/admin/customers'),
  deleteCustomer: (id) => request(`/api/admin/customers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  blockCustomer: (rowId, blocked) => request('/api/admin/blocked', { method: 'PATCH', body: { rowId, blocked } }),
  unblockEntry: (id) => request('/api/admin/blocked', { method: 'PATCH', body: { id, blocked: false } }),
  inquiries: () => request('/api/admin/inquiries'),
  markInquiry: (id, read) => request(`/api/admin/inquiries/${id}`, { method: 'PATCH', body: { read } }),
  deleteInquiry: (id) => request(`/api/admin/inquiries/${id}`, { method: 'DELETE' }),
  adminTestimonials: () => request('/api/admin/testimonials'),
  saveTestimonial: (body, id) => request(id ? `/api/admin/testimonials/${id}` : '/api/admin/testimonials', { method: id ? 'PUT' : 'POST', body }),
  deleteTestimonial: (id) => request(`/api/admin/testimonials/${id}`, { method: 'DELETE' }),
  saveSettings: (body) => request('/api/admin/settings', { method: 'PUT', body }),
  deleteSamples: () => request('/api/admin/sample-data/delete', { method: 'POST', body: {} }),
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return request('/api/admin/upload', { method: 'POST', form })
  },
  // Server keeps the file if a saved listing/project still uses it; otherwise it's deleted from storage.
  discardUpload: (url) => (String(url).startsWith('/uploads/') ? request('/api/admin/upload', { method: 'DELETE', body: { url } }).catch(() => null) : Promise.resolve(null)),
  // XHR rather than fetch: fetch can't report upload progress, and videos take a while on mobile data.
  uploadVideo: (file, onProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/upload-video')
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      let data = {}
      try { data = JSON.parse(xhr.responseText) } catch { /* not json */ }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data)
      const error = new Error(data.error || (xhr.status === 413 ? 'حجم الفيديو كبير' : 'تعذر رفع الفيديو'))
      error.status = xhr.status
      reject(error)
    }
    xhr.onerror = () => reject(new Error('تعذر الاتصال بالخادم'))
    xhr.send(file)
  }),
}
