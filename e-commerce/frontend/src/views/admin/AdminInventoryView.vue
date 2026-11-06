<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { actualizarStock, listarInventario } from '../../services/admin'
import { formatPrice } from '../../utils/format'

const products = ref([])
const loading = ref(true)
const loadError = ref('')
const search = ref('')
// Stock tipeado en cada fila (string del input), por id de producto
const draftStock = reactive({})
const rowErrors = reactive({})
const savingId = ref(null)
const feedback = ref({ type: '', message: '' })

const visibleProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return products.value
  return products.value.filter((product) =>
    [product.nombre, product.marca, product.categoria].some((value) => String(value || '').toLowerCase().includes(term)),
  )
})
const outOfStockCount = computed(() => products.value.filter((product) => Number(product.stock) === 0).length)

function describeError(error) {
  return error instanceof TypeError
    ? 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
    : error.message
}

async function loadInventory() {
  loading.value = true
  loadError.value = ''
  try {
    products.value = await listarInventario()
    for (const product of products.value) draftStock[product.id] = String(product.stock)
  } catch (error) {
    console.error('No se pudo cargar el inventario:', error)
    loadError.value = describeError(error)
  } finally {
    loading.value = false
  }
}

function isDirty(product) {
  return String(draftStock[product.id] ?? '').trim() !== String(product.stock)
}

function isZero(product) {
  return Number(product.stock) === 0
}

async function saveStock(product) {
  rowErrors[product.id] = ''
  feedback.value = { type: '', message: '' }
  const raw = String(draftStock[product.id] ?? '').trim()
  // El backend exige un entero >= 0
  if (!/^\d+$/.test(raw)) {
    rowErrors[product.id] = 'Ingresá un entero mayor o igual a 0.'
    return
  }

  savingId.value = product.id
  try {
    const result = await actualizarStock(product.id, Number(raw))
    product.stock = Number(result.producto?.stock ?? raw)
    draftStock[product.id] = String(product.stock)
    feedback.value = { type: 'success', message: `Stock de "${product.nombre}" actualizado a ${product.stock}.` }
  } catch (error) {
    console.error('No se pudo actualizar el stock:', error)
    rowErrors[product.id] = describeError(error)
  } finally {
    savingId.value = null
  }
}

onMounted(loadInventory)
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p>
        Editá el stock directamente en la fila.
        <strong v-if="outOfStockCount"> {{ outOfStockCount }} producto(s) sin stock.</strong>
      </p>
      <label class="form-field inventory-search">
        Buscar
        <input v-model="search" type="search" placeholder="Producto, marca o categoría" />
      </label>
    </div>

    <p v-if="feedback.type === 'success'" class="form-success-box" role="status">{{ feedback.message }}</p>

    <div v-if="loading" class="catalog-state" role="status">Cargando inventario…</div>

    <div v-else-if="loadError" class="catalog-state catalog-state-error" role="alert">
      <h3>No pudimos cargar el inventario</h3>
      <p>{{ loadError }}</p>
      <button class="secondary-button" type="button" style="margin-top: 14px" @click="loadInventory">Reintentar</button>
    </div>

    <div v-else-if="!visibleProducts.length" class="catalog-state" role="status">
      {{ products.length ? 'Ningún producto coincide con la búsqueda.' : 'Todavía no hay productos.' }}
    </div>

    <div v-else class="table-scroll">
      <table class="data-table">
        <caption class="visually-hidden">Inventario de productos</caption>
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col">Marca</th>
            <th scope="col">Categoría</th>
            <th scope="col" class="num">Precio</th>
            <th scope="col">Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in visibleProducts" :key="product.id" :class="{ 'row-alert': isZero(product) }">
            <td>
              <strong>{{ product.nombre }}</strong>
              <span v-if="isZero(product)" class="status-badge status-sin-stock stock-badge">Sin stock</span>
            </td>
            <td>{{ product.marca }}</td>
            <td>{{ product.categoria }}</td>
            <td class="num">{{ formatPrice(product.precio) }}</td>
            <td>
              <form class="table-actions" novalidate @submit.prevent="saveStock(product)">
                <input
                  v-model="draftStock[product.id]"
                  :class="['inline-input', { 'is-zero': isZero(product) }]"
                  type="number"
                  min="0"
                  step="1"
                  inputmode="numeric"
                  :aria-label="`Stock de ${product.nombre}`"
                  :disabled="savingId === product.id"
                />
                <button
                  class="table-action"
                  type="submit"
                  :disabled="!isDirty(product) || savingId === product.id"
                >
                  {{ savingId === product.id ? 'Guardando…' : 'Guardar' }}
                </button>
              </form>
              <p v-if="rowErrors[product.id]" class="form-error row-error" role="alert">{{ rowErrors[product.id] }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.inventory-search {
  min-width: 220px;
}

.stock-badge {
  margin-left: 8px;
}

.row-error {
  margin: 6px 0 0;
}
</style>
