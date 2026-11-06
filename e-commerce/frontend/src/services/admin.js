import { apiRequest } from './api'

function ensureArray(rows, what) {
  if (!Array.isArray(rows)) {
    throw new Error(`${what} recibidos del servidor no tienen el formato esperado.`)
  }
  return rows
}

// ---- Órdenes (ADMIN) ----

// GET /ordenes -> todas las órdenes con usuario_nombre, usuario_email y metodo_pago_nombre.
async function listarOrdenes() {
  return ensureArray(await apiRequest('/ordenes'), 'Las órdenes')
}

// PUT /ordenes/:id/estado -> { mensaje, orden, reembolsos }. `reembolsos` es la lista de ids de pagos de
// Mercado Pago devueltos. 409 si la transición es inválida; 502 si la orden se canceló pero el reembolso falló.
async function cambiarEstadoOrden(ordenId, nuevoEstado) {
  return apiRequest(`/ordenes/${ordenId}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ nuevoEstado }),
  })
}

// POST /pagos/sincronizar/:id -> { orden, reembolsado }. Consulta a Mercado Pago si la orden Pendiente ya se pagó.
async function verificarPagoOrden(ordenId) {
  return apiRequest(`/pagos/sincronizar/${ordenId}`, { method: 'POST' })
}

// ---- Métodos de pago (ADMIN) ----

// GET /metodos-pago/admin -> activos e inactivos.
async function listarMetodosPagoAdmin() {
  return ensureArray(await apiRequest('/metodos-pago/admin'), 'Los métodos de pago')
}

// POST /metodos-pago -> { mensaje, metodoPago }
async function crearMetodoPago({ nombre, descripcion, instrucciones }) {
  return apiRequest('/metodos-pago', {
    method: 'POST',
    body: JSON.stringify({ nombre, descripcion, instrucciones }),
  })
}

// PUT /metodos-pago/:id -> acepta nombre, descripcion, instrucciones y activo (boolean).
async function actualizarMetodoPago(id, datos) {
  return apiRequest(`/metodos-pago/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
}

// DELETE /metodos-pago/:id -> baja lógica (activo = false).
async function desactivarMetodoPago(id) {
  return apiRequest(`/metodos-pago/${id}`, { method: 'DELETE' })
}

// Reactivar es un PUT con activo: true (el DELETE es solo la baja lógica).
async function reactivarMetodoPago(id) {
  return actualizarMetodoPago(id, { activo: true })
}

// ---- Inventario ----

// GET /inventario -> productos con stock, marca y categoría (ruta pública).
async function listarInventario() {
  return ensureArray(await apiRequest('/inventario'), 'El inventario')
}

// PUT /inventario/:id/stock (ADMIN) -> { mensaje, producto }. El stock es un entero >= 0.
async function actualizarStock(productoId, stock) {
  return apiRequest(`/inventario/${productoId}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ stock }),
  })
}

// ---- Usuarios (ADMIN, solo lectura) ----

// GET /usuarios
async function listarUsuarios() {
  return ensureArray(await apiRequest('/usuarios'), 'Los usuarios')
}

export {
  actualizarMetodoPago,
  actualizarStock,
  cambiarEstadoOrden,
  crearMetodoPago,
  desactivarMetodoPago,
  listarInventario,
  listarMetodosPagoAdmin,
  listarOrdenes,
  listarUsuarios,
  reactivarMetodoPago,
  verificarPagoOrden,
}
