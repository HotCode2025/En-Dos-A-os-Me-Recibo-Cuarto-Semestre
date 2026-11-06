<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  actualizarMetodoPago,
  crearMetodoPago,
  desactivarMetodoPago,
  listarMetodosPagoAdmin,
  reactivarMetodoPago,
} from '../../services/admin'

const methods = ref([])
const loading = ref(true)
const loadError = ref('')
// null = formulario cerrado, 'new' = alta, número = id del método en edición
const editingId = ref(null)
const draft = reactive({ nombre: '', descripcion: '', instrucciones: '' })
const formError = ref('')
const saving = ref(false)
const busyId = ref(null)
const feedback = ref({ type: '', message: '' })

function describeError(error) {
  return error instanceof TypeError
    ? 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
    : error.message
}

async function loadMethods() {
  loading.value = true
  loadError.value = ''
  try {
    methods.value = await listarMetodosPagoAdmin()
  } catch (error) {
    console.error('No se pudieron cargar los métodos de pago:', error)
    loadError.value = describeError(error)
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingId.value = 'new'
  Object.assign(draft, { nombre: '', descripcion: '', instrucciones: '' })
  formError.value = ''
}

function openEdit(method) {
  editingId.value = method.id
  Object.assign(draft, {
    nombre: method.nombre || '',
    descripcion: method.descripcion || '',
    instrucciones: method.instrucciones || '',
  })
  formError.value = ''
}

function closeForm() {
  editingId.value = null
  formError.value = ''
}

async function saveMethod() {
  formError.value = ''
  const data = {
    nombre: draft.nombre.trim(),
    descripcion: draft.descripcion.trim(),
    instrucciones: draft.instrucciones.trim(),
  }
  if (!data.nombre) {
    formError.value = 'El nombre del método de pago es obligatorio.'
    return
  }

  saving.value = true
  try {
    if (editingId.value === 'new') {
      await crearMetodoPago(data)
      feedback.value = { type: 'success', message: `Método de pago "${data.nombre}" creado.` }
    } else {
      await actualizarMetodoPago(editingId.value, data)
      feedback.value = { type: 'success', message: `Método de pago "${data.nombre}" actualizado.` }
    }
    closeForm()
    await loadMethods()
  } catch (error) {
    console.error('No se pudo guardar el método de pago:', error)
    formError.value = describeError(error)
  } finally {
    saving.value = false
  }
}

async function toggleActive(method) {
  feedback.value = { type: '', message: '' }
  busyId.value = method.id
  try {
    if (method.activo) {
      await desactivarMetodoPago(method.id)
      method.activo = false
      feedback.value = { type: 'success', message: `"${method.nombre}" se desactivó: ya no aparece en el checkout.` }
    } else {
      await reactivarMetodoPago(method.id)
      method.activo = true
      feedback.value = { type: 'success', message: `"${method.nombre}" se reactivó y vuelve a aparecer en el checkout.` }
    }
  } catch (error) {
    console.error('No se pudo cambiar el estado del método de pago:', error)
    feedback.value = { type: 'error', message: describeError(error) }
  } finally {
    busyId.value = null
  }
}

onMounted(loadMethods)
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p>
        Los métodos desactivados no aparecen en el checkout, pero las órdenes existentes siguen referenciándolos.
      </p>
      <button v-if="editingId === null" class="primary-button" type="button" @click="openNew">
        Agregar método de pago
      </button>
    </div>

    <p v-if="feedback.type === 'success'" class="form-success-box" role="status">{{ feedback.message }}</p>
    <p v-else-if="feedback.type === 'error'" class="form-error feedback-error" role="alert">{{ feedback.message }}</p>

    <form v-if="editingId !== null" class="product-editor" novalidate @submit.prevent="saveMethod">
      <div class="product-editor-heading">
        <div>
          <span class="eyebrow">MÉTODOS DE PAGO</span>
          <h3>{{ editingId === 'new' ? 'Nuevo método de pago' : 'Editar método de pago' }}</h3>
        </div>
        <button class="secondary-button" type="button" :disabled="saving" @click="closeForm">Cancelar</button>
      </div>
      <div class="product-editor-grid">
        <label class="form-field">
          Nombre
          <input v-model="draft.nombre" maxlength="100" required />
        </label>
        <label class="form-field">
          Descripción
          <input v-model="draft.descripcion" />
        </label>
        <label class="form-field product-description-field">
          Instrucciones para el cliente
          <textarea v-model="draft.instrucciones" rows="3" placeholder="Por ejemplo: datos de la cuenta para transferir"></textarea>
        </label>
      </div>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <button class="primary-button" type="submit" :disabled="saving">
        {{ saving ? 'Guardando…' : 'Guardar método de pago' }}
      </button>
    </form>

    <div v-if="loading" class="catalog-state" role="status">Cargando métodos de pago…</div>

    <div v-else-if="loadError" class="catalog-state catalog-state-error" role="alert">
      <h3>No pudimos cargar los métodos de pago</h3>
      <p>{{ loadError }}</p>
      <button class="secondary-button" type="button" style="margin-top: 14px" @click="loadMethods">Reintentar</button>
    </div>

    <div v-else-if="!methods.length" class="catalog-state" role="status">Todavía no hay métodos de pago.</div>

    <div v-else class="table-scroll">
      <table class="data-table">
        <caption class="visually-hidden">Métodos de pago</caption>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Descripción</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="method in methods" :key="method.id" :class="{ 'row-muted': !method.activo }">
            <td>
              <strong>{{ method.nombre }}</strong>
            </td>
            <td>{{ method.descripcion || '—' }}</td>
            <td>
              <span :class="['status-badge', method.activo ? 'status-activo' : 'status-inactivo']">
                {{ method.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <button class="table-action" type="button" :disabled="busyId === method.id" @click="openEdit(method)">
                  Editar
                </button>
                <button
                  :class="['table-action', { 'table-action-danger': method.activo }]"
                  type="button"
                  :disabled="busyId === method.id"
                  @click="toggleActive(method)"
                >
                  {{ method.activo ? 'Desactivar' : 'Reactivar' }}
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
.feedback-error {
  margin: 0 0 14px;
  padding: 11px 14px;
  border: 1px solid #fecdca;
  border-radius: 6px;
  background: #fff5f4;
}
</style>
