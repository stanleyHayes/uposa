import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const ADMIN_TOKEN_KEY = 'uposa_admin_token'
export const ADMIN_REFRESH_TOKEN_KEY = 'uposa_admin_refresh_token'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// One refresh at a time: requests that 401 together share the same attempt.
let refreshInFlight: Promise<string | null> | null = null

/** Effective permissions and role the API returns alongside a session (login, refresh, /auth/me). */
export interface AdminAccess {
  permissions?: string[]
  roleInfo?: { key: string; name: string }
}

// The auth store subscribes so permission changes picked up on refresh apply immediately
// (client.ts can't import the store: the store imports this module).
let accessListener: ((access: AdminAccess) => void) | null = null
export function onAdminAccessRefreshed(listener: (access: AdminAccess) => void) {
  accessListener = listener
}

/**
 * Exchange the stored refresh token for a new access token. Access tokens last
 * 15 minutes, so without this admins were bounced to /login mid-edit (losing
 * the form, e.g. while uploading an image). Resolves null when the session
 * can't be renewed.
 */
export function refreshAdminSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
  if (!refreshToken) return Promise.resolve(null)

  refreshInFlight = axios
    .post(`${API_BASE_URL}/auth/admin/refresh`, { refreshToken })
    .then((res) => {
      const token: string | undefined = res.data?.data?.token
      const nextRefresh: string | undefined = res.data?.data?.refreshToken
      if (!token) return null
      localStorage.setItem(ADMIN_TOKEN_KEY, token)
      if (nextRefresh) localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, nextRefresh)
      if (res.data?.data?.permissions) accessListener?.(res.data.data as AdminAccess)
      return token
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
  localStorage.removeItem('uposa_auth')
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const isAuthCall = typeof original?.url === 'string' && original.url.includes('/auth/admin/')

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true
      const token = await refreshAdminSession()
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return client(original)
      }
      clearAdminSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
