<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { cambiarEstadoOrden, listarOrdenes, verificarPagoOrden } from '../../services/admin'
import { ORDER_TRANSITIONS, formatDate, formatPrice, nextOrderStates, statusClass } from '../../utils/format'

const orders = ref([])
const loading = ref(true)
const loadError = ref('')
const stateFilter = ref('')
// Estado elegido en el select de cada fila, por id de orden
const selectedState = reactive({})
const updatingId = ref(null)
const feedback = ref({ type: '', message: '' })

const states = Object.keys(ORDER_TRANSITIONS)
const visibleOrders = computed(() =>
  stateFilter.value ? orders.value.filter((order) => order.estado === stateFilter.value) : orders.value,
)

async function loadOrders() {
  loading.value = true
  loadError.value = ''
  try {
    orders.value = await listarOrdenes()
  } catch (error) {
    console.error('No se pudieron cargar las órdenes:', error)
    loadError.value = describeError(error)
  } finally {
    loading.value = false
  }
}

function describeError(error) {
  return error instanceof TypeError
    ? 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
    : error.message
}

async function applyState(order) {
  const newState = selectedState[order.id]
  if (!newState) return
  if (
    newState === 'Cancelado' &&
    order.estado === 'Pagado' &&
    !window.confirm(`La orden #${order.id} ya está paga: al cancelarla se repone el stock y se reembolsa el pago. ¿Continuar?`)
  ) {
    return
  }

  feedback.value = { type: '', message: '' }
  updatingId.value = order.id
  try {
    const result = await cambiarEstadoOrden(order.id, newState)
    order.estado = result.orden?.estado ?? newState
    delete selectedState[order.id]

    const refunds = Array.isArray(result.reembolsos) ? result.reembolsos : []
    feedback.value = refunds.length
      ? {
          type: 'warning',
          message: `Orden #${order.id} cancelada. Se reembolsaron ${refunds.length} pago(s) en Mercado Pago (ID: ${refunds.join(', ')}).`,
        }
      : { type: 'success', message: `Orden #${order.id} actualizada a ${order.estado}.` }
  } catch (error) {
    console.error('No se pudo cambiar el estado de la orden:', error)
    feedback.value = { type: 'error', message: describeError(error) }
    // 502: la cancelación quedó guardada aunque falló el reembolso; 409: el estado cambió por otro lado.
    if (error.status === 502 || error.status === 409) await refreshQuietly()
  } finally {
    updatingId.value = null
  }
}

// Consulta a Mercado Pago si una orden Pendiente ya fue pagada y refresca la fila.
async function verifyPayment(order) {
  feedback.value = { type: '', message: '' }
  updatingId.value = order.id
  try {
    const result = await verificarPagoOrden(order.id)
    order.estado = result.orden?.estado ?? order.estado
    feedback.value =
      order.estado === 'Pagado'
        ? { type: 'success', message: `Orden #${order.id}: el pago está acreditado y la orden quedó Pagado.` }
        : result.reembolsado
          ? { type: 'warning', message: `Orden #${order.id}: estaba cancelada, así que se reembolsó el pago.` }
          : { type: 'warning', message: `Orden #${order.id}: no encontramos un pago aprobado en Mercado Pago.` }
  } catch (error) {
    console.error('No se pudo verificar el pago de la orden:', error)
    feedback.value = { type: 'error', message: describeError(error) }
  } finally {
    updatingId.value = null
  }
}

// Recarga la lista sin pisar el mensaje de error que se acaba de mostrar
async function refreshQuietly() {
  try {
    orders.value = await listarOrdenes()
  } catch (error) {
    console.error('No se pudo refrescar la lista de órdenes:', error)
  }
}

onMounted(loadOrders)
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p>Cambiá el estado de una orden. Solo se ofrecen las transiciones válidas; Entregado y Cancelado son finales.</p>
      <label class="form-field order-filter">
        Filtrar por estado
        <select v-model="stateFilter">
          <option value="">Todos</option>
          <option v-for="state in states" :key="state" :value="state">{{ state }}</option>
        </select>
      </label>
    </div>

    <p v-if="feedback.type === 'success'" class="form-success-box" role="status">{{ feedback.message }}</p>
    <p v-else-if="feedback.type === 'warning'" class="form-warning-box" role="status">{{ feedback.message }}</p>
    <p v-else-if="feedback.type === 'error'" class="form-error feedback-error" role="alert">{{ feedback.message }}</p>

    <div v-if="loading" class="catalog-state" role="status">Cargando órdenes…</div>

    <div v-else-if="loadError" class="catalog-state catalog-state-error" role="alert">
      <h3>No pudimos cargar las órdenes</h3>
      <p>{{ loadError }}</p>
      <button class="secondary-button" type="button" style="margin-top: 14px" @click="loadOrders">Reintentar</button>
    </div>

    <div v-else-if="!visibleOrders.length" class="catalog-state" role="status">
      {{ orders.length ? 'No hay órdenes en ese estado.' : 'Todavía no hay órdenes.' }}
    </div>

    <div v-else class="table-scroll">
      <table class="data-table">
        <caption class="visually-hidden">Todas las órdenes</caption>
        <thead>
          <tr>
            <th scope="col">Orden</th>
            <th scope="col">Fecha</th>
            <th scope="col">Cliente</th>
            <th scope="col">Pago</th>
            <th scope="col" class="num">Total</th>
            <th scope="col">Estado</th>
            <th scope="col">Cambiar a</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in visibleOrders" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>{{ formatDate(order.fecha_pedido) }}</td>
            <td>
              {{ order.usuario_nombre }}
              <br /><small class="cell-muted">{{ order.usuario_email }}</small>
            </td>
            <td>{{ order.metodo_pago_nombre || '—' }}</td>
            <td class="num">
              <strong>{{ formatPrice(order.total) }}</strong>
            </td>
            <td>
              <span :class="statusClass(order.estado)">{{ order.estado }}</span>
            </td>
            <td>
              <span v-if="!nextOrderStates(order.estado).length" class="cell-muted">Estado final</span>
              <div v-else class="table-actions">
                <select
                  v-model="selectedState[order.id]"
                  class="inline-input state-select"
                  :aria-label="`Nuevo estado de la orden ${order.id}`"
                  :disabled="updatingId === order.id"
                >
                  <option value="" disabled>Elegir…</option>
                  <option v-for="state in nextOrderStates(order.estado)" :key="state" :value="state">
                    {{ state }}
                  </option>
                </select>
                <button
                  class="table-action"
                  type="button"
                  :disabled="!selectedState[order.id] || updatingId === order.id"
                  @click="applyState(order)"
                >
                  {{ updatingId === order.id ? 'Aplicando…' : 'Aplicar' }}
                </button>
                <button
                  v-if="order.estado === 'Pendiente'"
                  class="table-action"
                  type="button"
                  :disabled="updatingId === order.id"
                  @click="verifyPayment(order)"
                >
                  Verificar pago
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.order-filter {
  min-width: 180px;
}

.cell-muted {
  color: var(--muted);
  font-size: 10px;
}

.state-select {
  width: auto;
  min-width: 110px;
}

.feedback-error {
  margin: 0 0 14px;
  padding: 11px 14px;
  border: 1px solid #fecdca;
  border-radius: 6px;
  background: #fff5f4;
}
</style>
