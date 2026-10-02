import { accessToken } from '../stores/auth'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken.value) {
    headers.set('Authorization', `Bearer ${accessToken.value}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  const responseBody = await response.text()
  let result
  try {
    result = responseBody ? JSON.parse(responseBody) : {}
  } catch {
    if (!response.ok) {
      throw new Error(`No se pudo completar la solicitud al backend (HTTP ${response.status}).`)
    }
    throw new Error('El servidor devolvió una respuesta inválida.')
  }
  if (!response.ok) {
    throw new Error(result.error || result.mensaje || `La solicitud falló (${response.status}).`)
  }
  return result
}

export { apiRequest }
