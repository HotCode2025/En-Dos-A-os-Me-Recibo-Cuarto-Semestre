<script setup>
import { onMounted, ref } from 'vue'
import { listarUsuarios } from '../../services/admin'
import { formatDate } from '../../utils/format'

const users = ref([])
const loading = ref(true)
const loadError = ref('')

async function loadUsers() {
  loading.value = true
  loadError.value = ''
  try {
    users.value = await listarUsuarios()
  } catch (error) {
    console.error('No se pudieron cargar los usuarios:', error)
    loadError.value =
      error instanceof TypeError
        ? 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
        : error.message
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p>Listado de solo lectura. El backend no ofrece cambiar roles ni dar de baja usuarios.</p>
    </div>

    <div v-if="loading" class="catalog-state" role="status">Cargando usuarios…</div>

    <div v-else-if="loadError" class="catalog-state catalog-state-error" role="alert">
      <h3>No pudimos cargar los usuarios</h3>
      <p>{{ loadError }}</p>
      <button class="secondary-button" type="button" style="margin-top: 14px" @click="loadUsers">Reintentar</button>
    </div>

    <div v-else-if="!users.length" class="catalog-state" role="status">Todavía no hay usuarios registrados.</div>

    <div v-else class="table-scroll">
      <table class="data-table">
        <caption class="visually-hidden">Usuarios registrados</caption>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nombre</th>
            <th scope="col">Email</th>
            <th scope="col">Teléfono</th>
            <th scope="col">Rol</th>
            <th scope="col">Registro</th>
            <th scope="col">Ciudad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.nombre }} {{ user.apellido }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.telefono || '—' }}</td>
            <td>
              <span :class="['status-badge', user.rol === 'ADMIN' ? 'status-enviado' : '']">{{ user.rol }}</span>
            </td>
            <td>{{ formatDate(user.fecha_registro) }}</td>
            <td>{{ user.ciudad || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
