import { apiRequest } from './api'

// GET /usuarios/perfil -> fila del usuario autenticado (sin password_hash).
async function obtenerPerfil() {
  return apiRequest('/usuarios/perfil')
}

// PUT /usuarios/perfil -> perfil actualizado. 409 si el email ya es de otro usuario.
async function actualizarPerfil(datos) {
  return apiRequest('/usuarios/perfil', {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
}

export { actualizarPerfil, obtenerPerfil }
