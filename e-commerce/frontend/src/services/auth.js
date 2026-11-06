import { apiRequest } from './api'

// Inicia sesión contra el backend y valida que la respuesta traiga los datos de sesión esperados.
// Devuelve { token, usuario }. Los errores de red (TypeError) se propagan para que la vista los traduzca.
async function loginRequest(email, password) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })

  if (!result.token || !result.usuario?.rol) {
    throw new Error('El servidor respondió sin los datos de sesión esperados.')
  }
  if (!['ADMIN', 'CLIENTE'].includes(result.usuario.rol)) {
    throw new Error('El servidor devolvió un rol de usuario no reconocido.')
  }
  return { token: result.token, usuario: result.usuario }
}

// Registra un cliente nuevo (POST /auth/register, 201). No devuelve token: después hay que iniciar sesión.
// En un 400 de validación el error trae `error.data.tipo` con el detalle por campo.
async function registerRequest({ nombre, apellido, email, telefono, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre, apellido, email, telefono, password }),
    skipAuth: true,
  })
}

export { loginRequest, registerRequest }
