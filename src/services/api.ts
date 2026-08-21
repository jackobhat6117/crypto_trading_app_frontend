import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'https://cryptoapp-api.onrender.com'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token.trim()}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const path = window.location.pathname || '/'
      const isAdmin = path.startsWith('/admin') || path.startsWith('/subadmin')
      if (!path.includes('/signin') && !path.includes('/signup') && path !== '/') {
        window.location.href = isAdmin ? '/admin/signin' : '/signin'
      }
    }
    return Promise.reject(error)
  }
)

export default api
