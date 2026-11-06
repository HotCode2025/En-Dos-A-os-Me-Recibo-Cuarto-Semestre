import { apiRequest } from './api'
import { avisar } from '../utils/avisos'

// GET /ordenes/mis-ordenes -> órdenes del usuario autenticado, más recientes primero.
// Cada fila trae id, estado, total, fecha_pedido y metodo_pago_nombre.
async function misOrdenes() {
  const rows = await apiRequest('/ordenes/mis-ordenes')
  if (!Array.isArray(rows)) {
    throw new Error('Las órdenes recibidas del servidor no tienen el formato esperado.')
  }
  return rows
}

// POST /pagos/sincronizar-pendientes -> { ordenes, pagadas }. Concilia con Mercado Pago las órdenes
// pendientes del usuario; `pagadas` son los ids que pasaron a Pagado.
async function sincronizarPendientes() {
  return apiRequest('/pagos/sincronizar-pendientes', { method: 'POST' })
}

// POST /pagos/sincronizar/:ordenId -> { orden, reembolsado }
async function sincronizarOrden(ordenId) {
  return apiRequest(`/pagos/sincronizar/${ordenId}`, { method: 'POST' })
}

// Tras iniciar sesión: concilia en segundo plano (sin bloquear ni mostrar errores) y avisa si algo se acreditó.
function sincronizarTrasLogin() {
  sincronizarPendientes()
    .then((resultado) => {
      if (resultado?.pagadas?.length) {
        avisar(
          resultado.pagadas.length === 1
            ? `Se acreditó el pago de tu orden #${resultado.pagadas[0]}.`
            : 'Se acreditaron los pagos de tus órdenes.',
          { to: '/mis-ordenes', label: 'Ver mis órdenes' },
        )
      }
    })
    .catch((error) => console.warn('No se pudo sincronizar los pagos pendientes:', error))
}

export { misOrdenes, sincronizarPendientes, sincronizarOrden, sincronizarTrasLogin }
