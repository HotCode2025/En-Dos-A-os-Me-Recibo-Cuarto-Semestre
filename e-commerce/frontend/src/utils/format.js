// Formateadores compartidos por las vistas nuevas (órdenes, admin).

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatPrice(value) {
  return priceFormatter.format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

// Mapa de transiciones de estado de una orden. Copia de TRANSICIONES en backend/src/services/ordenService.js:
// el backend sigue siendo la autoridad y rechaza cualquier cambio inválido con 409.
const ORDER_TRANSITIONS = {
  Pendiente: ['Pagado', 'Cancelado'],
  Pagado: ['Enviado', 'Cancelado'],
  Enviado: ['Entregado'],
  Entregado: [],
  Cancelado: [],
}

function nextOrderStates(currentState) {
  return ORDER_TRANSITIONS[currentState] ?? []
}

// Clase CSS del badge de estado: "Pendiente" -> "status-pendiente"
function statusClass(state) {
  return `status-badge status-${String(state || '').toLowerCase()}`
}

export { ORDER_TRANSITIONS, formatDate, formatPrice, nextOrderStates, statusClass }
