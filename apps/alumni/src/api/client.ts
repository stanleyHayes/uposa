import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const ACCESS_TOKEN_KEY = 'uposa_alumni_token'
const REFRESH_TOKEN_KEY = 'uposa_alumni_refresh_token'
const USER_KEY = 'uposa_alumni_user'
const AUTH_STORE_KEY = 'uposa_alumni_auth'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Module-level state for coordinating concurrent refreshes.
let refreshPromise: Promise<string> | null = null

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshResponse {
  success?: boolean
  message?: string
  data?: { token: string; refreshToken: string }
  // Some backends respond with these at the top level — handle both.
  token?: string
  refreshToken?: string
}

function clearAuthAndRedirect() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(AUTH_STORE_KEY)
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function performRefresh(refreshToken: string): Promise<string> {
  // Use a bare axios call so we don't trigger the response interceptor recursively.
  const res = await axios.post<RefreshResponse>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  )
  const body = res.data || {}
  const newAccess = body.data?.token ?? body.token
  const newRefresh = body.data?.refreshToken ?? body.refreshToken

  if (!newAccess || !newRefresh) {
    throw new Error('Refresh response missing tokens')
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, newAccess)
  localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh)

  // Best-effort: keep the persisted zustand store in sync so React reads see fresh tokens.
  try {
    const raw = localStorage.getItem(AUTH_STORE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state) {
        parsed.state.token = newAccess
        parsed.state.refreshToken = newRefresh
        localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(parsed))
      }
    }
  } catch {
    // ignore — primary source is the localStorage tokens above
  }

  return newAccess
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status

    // Don't try to refresh if there was no original request, no 401, or we already retried.
    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Don't loop the refresh endpoint itself.
    if (typeof original.url === 'string' && original.url.includes('/auth/refresh')) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
    const hadAccess = localStorage.getItem(ACCESS_TOKEN_KEY)

    // No refresh token available — fall back to legacy behavior: redirect if we had a session.
    if (!storedRefresh) {
      if (hadAccess) clearAuthAndRedirect()
      return Promise.reject(error)
    }

    original._retry = true

    try {
      // Coalesce concurrent 401s onto a single refresh.
      if (!refreshPromise) {
        refreshPromise = performRefresh(storedRefresh).finally(() => {
          refreshPromise = null
        })
      }
      const newAccess = await refreshPromise

      // Update header on the retried request.
      const retryConfig: AxiosRequestConfig = { ...original }
      const mergedHeaders = {
        ...(original.headers as Record<string, unknown>),
        Authorization: `Bearer ${newAccess}`,
      }
      retryConfig.headers = mergedHeaders as unknown as AxiosRequestConfig['headers']
      return client(retryConfig)
    } catch (refreshErr) {
      clearAuthAndRedirect()
      return Promise.reject(refreshErr)
    }
  }
)

export default client
