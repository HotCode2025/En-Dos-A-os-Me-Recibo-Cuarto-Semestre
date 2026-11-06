import { accessToken } from '../stores/auth'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')

// Función que se ejecuta cuando el backend rechaza con 401 un pedido que llevaba token (sesión vencida o alterada).
// Se registra desde main.js para evitar un ciclo de imports api.js -> router -> vistas -> api.js.
let unauthorizedHandler = null

function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

// Crea el Error de la API con el status HTTP adjunto para que los llamadores puedan distinguirlo.
// `data` es el body JSON de la respuesta (por ejemplo, { error, tipo } en un 400 de validación).
function createApiError(message, status, data) {
  const error = new Error(message)
  error.status = status
  if (data !== undefined) error.data = data
  return error
}

// options.skipAuth = true evita enviar el token (por ejemplo en el login) y no dispara el handler del 401.
async function apiRequest(path, { skipAuth = false, ...options } = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const sentToken = !skipAuth && Boolean(accessToken.value)
  if (sentToken) {
    headers.set('Authorization', `Bearer ${accessToken.value}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  const responseBody = await response.text()
  let result
  try {
    result = responseBody ? JSON.parse(responseBody) : {}
  } catch {
    if (!response.ok) {
      handleUnauthorized(response.status, sentToken)
      throw createApiError(
        `No se pudo completar la solicitud al backend (HTTP ${response.status}).`,
        response.status,
      )
    }
    throw createApiError('El servidor devolvió una respuesta inválida.', response.status)
  }
  if (!response.ok) {
    handleUnauthorized(response.status, sentToken)
    throw createApiError(
      result.error || result.mensaje || `La solicitud falló (${response.status}).`,
      response.status,
      result,
    )
  }
  return result
}

// Solo un 401 con token enviado cierra la sesión. El 403 (falta de permisos) no la cierra.
function handleUnauthorized(status, sentToken) {
  if (status === 401 && sentToken && unauthorizedHandler) {
    unauthorizedHandler()
  }
}

export { apiRequest, setUnauthorizedHandler }
