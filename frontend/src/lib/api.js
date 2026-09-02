const TOKEN_KEY = 'togetherdocs_access'
const USER_KEY = 'togetherdocs_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function setUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function extractError(data) {
  if (!data) return 'Request failed'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (data.message) return data.message
  if (Array.isArray(data)) return data.join(' ')
  const parts = []
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) parts.push(value.join(' '))
    else if (typeof value === 'string') parts.push(value)
  }
  return parts.join(' ') || 'Request failed'
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0)
  }

  const data = await res.json().catch(() => null)

  if (res.status === 401) {
    clearAuth()
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new ApiError('Session expired. Please log in again.', 401)
  }

  if (!res.ok) {
    throw new ApiError(extractError(data), res.status)
  }

  return data
}

export const api = {
  signup: (body) => request('/auth/signup/', { method: 'POST', body }),
  login: (body) => request('/auth/login/', { method: 'POST', body }),
  listDocuments: () => request('/documents/'),
  createDocument: (body) => request('/documents/', { method: 'POST', body }),
  getDocument: (id) => request(`/documents/${id}/`),
  updateDocument: (id, body) => request(`/documents/${id}/`, { method: 'PATCH', body }),
  deleteDocument: (id) => request(`/documents/${id}/`, { method: 'DELETE' }),
  shareDocument: (id, body) => request(`/documents/permissions/${id}/share/`, { method: 'POST', body }),
  listVersions: (id) => request(`/documents/${id}/versions/`),
}