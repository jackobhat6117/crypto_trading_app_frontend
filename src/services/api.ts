import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_URL } from './config'
import { refreshAccessToken, shouldAttemptRefresh } from './sessionRefresh'
import { sessionManager } from './sessionManager'

const api = axios.create({
  baseURL: API_URL,
  timeout: 12_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const PUBLIC_PATHS = ['/api/coins', '/api/market', '/api/metals', '/api/settings/public']

function isPublicRequest(url?: string) {
  if (!url) return false
  return PUBLIC_PATHS.some((path) => url.includes(path))
}

let refreshPromise: Promise<string | null> | null = null

async function runRefresh(): Promise<string | null> {
  const refreshToken = sessionManager.getRefreshToken()
  if (!refreshToken) return null

  try {
    const tokens = await refreshAccessToken(refreshToken)
    sessionManager.updateTokens(tokens)
    if (tokens.user) sessionManager.updateUser(tokens.user)
    return tokens.accessToken
  } catch {
    sessionManager.clearSession('expired')
    return null
  }
}

function queueRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.request.use(
  async (config) => {
    const url = config.url ?? ''
    const publicRequest = isPublicRequest(url)

    if (!publicRequest && sessionManager.hasAccessToken() && sessionManager.isSessionExpired()) {
      sessionManager.clearSession('expired')
      sessionManager.redirectToSignIn()
      return Promise.reject(new Error('Session expired'))
    }

    if (
      !publicRequest &&
      sessionManager.hasAccessToken() &&
      sessionManager.isAccessTokenExpired() &&
      sessionManager.getRefreshToken() &&
      shouldAttemptRefresh(url)
    ) {
      const refreshed = await queueRefresh()
      if (!refreshed) {
        sessionManager.redirectToSignIn()
        return Promise.reject(new Error('Session refresh failed'))
      }
    }

    const token = sessionManager.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = config?.url ?? ''

    if (status === 401 && config && !config._retry && shouldAttemptRefresh(url)) {
      config._retry = true
      const refreshed = sessionManager.getRefreshToken() ? await queueRefresh() : null

      if (refreshed) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${refreshed}`
        return api(config)
      }

      sessionManager.clearSession('expired')
      sessionManager.redirectToSignIn()
    }

    return Promise.reject(error)
  }
)

export { API_URL } from './config'

export default api
