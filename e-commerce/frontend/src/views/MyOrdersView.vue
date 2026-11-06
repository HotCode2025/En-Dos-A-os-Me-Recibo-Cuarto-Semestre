<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { misOrdenes, sincronizarPendientes } from '../services/ordenes'
import { avisar } from '../utils/avisos'
import { formatDate, formatPrice, statusClass } from '../utils/format'

const orders = ref([])
const loading = ref(true)
const verifying = ref(false)
const loadError = ref('')

// Cada carga nueva (o el desmontaje) invalida la sincronización anterior: su resultado se descarta.
let currentLoad = 0

// Segundo plano: concilia con Mercado Pago sin bloquear la lista. Si falla, se muestran igual las órdenes guardadas.
async function verifyPayments(loadId) {
  verifying.value = true
  try {
    const result = await sincronizarPendientes()
    if (loadId !== currentLoad) return
    const paid = Array.isArray(result?.pagadas) ? result.pagadas : []
    if (!paid.length) return
    if (Array.isArray(result.ordenes)) orders.value = result.ordenes
    paid.forEach((id) => avisar(`Se confirmó el pago de la orden #${id}`))
  } catch (error) {
    console.warn('No se pudo sincronizar los pagos:', error)
  } finally {
    if (loadId === currentLoad) verifying.value = false
  }
}

async function loadOrders() {
  const loadId = ++currentLoad
  loading.value = true
  verifying.value = false
  loadError.value = ''
  try {
    const rows = await misOrdenes()
    if (loadId !== currentLoad) return
    orders.value = rows
  } catch (error) {
    if (loadId !== currentLoad) return
    console.error('No se pudieron cargar las órdenes:', error)
    loadError.value =
      error instanceof TypeError
        ? 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
        : error.message
    return
  } finally {
    if (loadId === currentLoad) loading.value = false
  }
  verifyPayments(loadId)
}

onMounted(loadOrders)
onBeforeUnmount(() => {
  currentLoad += 1
})
</script>

<template>
  <section class="products-intro">
    <div class="section-shell">
      <span class="eyebrow">PUNTOZERO · MI CUENTA</span>
      <h1>Mis órdenes<span>.</span></h1>
      <p>Seguí el estado de tus compras.</p>
      <button class="secondary-button" type="button" :disabled="loading" @click="loadOrders">
        {{ loading ? 'Actualizando…' : 'Actualizar estado' }}
      </button>
      <p v-if="verifying" class="verifying-note" role="status">Verificando pagos…</p>
    </div>
  </section>

  <div class="section-shell account-panel">
    <div v-if="loading" class="catalog-state" role="status">Cargando tus órdenes…</div>

    <div v-else-if="loadError" class="catalog-state catalog-state-error" role="alert">
      <h3>No pudimos cargar tus órdenes</h3>
      <p>{{ loadError }}</p>
      <button class="secondary-button" type="button" style="margin-top: 14px" @click="loadOrders">Reintentar</button>
    </div>

    <div v-else-if="!orders.length" class="empty-results">
      <span aria-hidden="true">⌑</span>
      <h3>Todavía no tenés órdenes</h3>
      <p>Cuando hagas tu primera compra la vas a ver acá.</p>
      <RouterLink class="primary-button" to="/productos">Explorar productos</RouterLink>
    </div>

    <div v-else class="table-scroll">
      <table class="data-table">
        <caption class="visually-hidden">Listado de tus órdenes</caption>
        <thead>
          <tr>
            <th scope="col">Orden</th>
            <th scope="col">Fecha</th>
            <th scope="col">Estado</th>
            <th scope="col">Método de pago</th>
            <th scope="col" class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>{{ formatDate(order.fecha_pedido) }}</td>
            <td>
              <span :class="statusClass(order.estado)">{{ order.estado }}</span>
            </td>
            <td>{{ order.metodo_pago_nombre || '—' }}</td>
            <td class="num">
              <strong>{{ formatPrice(order.total) }}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.verifying-note {
  margin: 12px 0 0;
  font-size: 0.9rem;
  opacity: 0.75;
}
</style>
