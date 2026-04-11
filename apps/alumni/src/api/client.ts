import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('uposa_alumni_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we had a token (session expired), not on login attempts
      const hadToken = localStorage.getItem('uposa_alumni_token')
      if (hadToken) {
        localStorage.removeItem('uposa_alumni_token')
        localStorage.removeItem('uposa_alumni_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
