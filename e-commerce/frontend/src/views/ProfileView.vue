<script setup>
import { onMounted, reactive, ref } from 'vue'
import { actualizarUsuarioSesion } from '../stores/auth'
import { actualizarPerfil, obtenerPerfil } from '../services/usuarios'
import { formatDate } from '../utils/format'

const FIELDS = ['nombre', 'apellido', 'email', 'telefono', 'calle_numero', 'ciudad', 'codigo_postal', 'pais']
const PHONE_FORMAT = /^\+?[\d\s-]{6,20}$/
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const form = reactive(Object.fromEntries(FIELDS.map((field) => [field, ''])))
const memberSince = ref('')
// Email tal como lo devolvió el servidor: solo se reenvía si el usuario lo cambió.
const loadedEmail = ref('')
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')
const fieldErrors = ref([])
const saveSuccess = ref('')

function fillForm(profile) {
  for (const field of FIELDS) form[field] = profile[field] ?? ''
  loadedEmail.value = String(profile.email ?? '').trim()
}

async function loadProfile() {
  loading.value = true
  loadError.value = ''
  try {
    const profile = await obtenerPerfil()
    fillForm(profile)
    memberSince.value = profile.fecha_registro || ''
  } catch (error) {
    console.error('No se pudo cargar el perfil:', error)
    loadError.value =
      error instanceof TypeError
        ? 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
        : error.message
  } finally {
    loading.value = false
  }
}

function validateForm() {
  const problems = []
  if (!form.nombre.trim()) problems.push('El nombre no puede quedar vacío.')
  if (!form.apellido.trim()) problems.push('El apellido no puede quedar vacío.')
  if (!EMAIL_FORMAT.test(form.email.trim())) problems.push('Ingresá un email con formato válido.')
  const phone = form.telefono.trim()
  if (!PHONE_FORMAT.test(phone) || phone.replace(/\D/g, '').length < 6) {
    problems.push('El teléfono debe tener entre 6 y 20 caracteres: dígitos, espacios o guiones, con un + opcional al inicio.')
  }
  return problems
}

async function saveProfile() {
  saveError.value = ''
  saveSuccess.value = ''
  fieldErrors.value = []

  const problems = validateForm()
  if (problems.length) {
    saveError.value = 'Revisá los datos ingresados.'
    fieldErrors.value = problems
    return
  }

  // El backend ignora los campos vacíos (no los pisa), así que solo se mandan los que tienen valor.
  const changes = {}
  for (const field of FIELDS) {
    const value = String(form[field] ?? '').trim()
    if (value) changes[field] = value
  }
  // Reenviar un email sin cambios no aporta nada y el backend lo trataría como un posible duplicado.
  if (changes.email === loadedEmail.value) delete changes.email

  saving.value = true
  try {
    const updated = await actualizarPerfil(changes)
    fillForm(updated)
    actualizarUsuarioSesion({ nombre: updated.nombre, apellido: updated.apellido, email: updated.email })
    saveSuccess.value = 'Guardamos los cambios de tu perfil.'
  } catch (error) {
    console.error('No se pudo guardar el perfil:', error)
    if (error instanceof TypeError) {
      saveError.value = 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
    } else {
      saveError.value = error.message
      const details = Array.isArray(error.data?.tipo) ? error.data.tipo : []
      fieldErrors.value = details.map((detail) => detail.msg).filter(Boolean)
    }
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <section class="products-intro">
    <div class="section-shell">
      <span class="eyebrow">PUNTOZERO · MI CUENTA</span>
      <h1>Mi perfil<span>.</span></h1>
      <p>Mantené tus datos de contacto y de envío al día.</p>
    </div>
  </section>

  <div class="section-shell account-panel">
    <div v-if="loading" class="catalog-state" role="status">Cargando tu perfil…</div>

    <div v-else-if="loadError" class="catalog-state catalog-state-error" role="alert">
      <h3>No pudimos cargar tu perfil</h3>
      <p>{{ loadError }}</p>
      <button class="secondary-button retry-button" type="button" @click="loadProfile">Reintentar</button>
    </div>

    <form v-else class="account-card" novalidate @submit.prevent="saveProfile">
      <div>
        <span class="eyebrow">DATOS PERSONALES</span>
        <p v-if="memberSince" class="member-since">Cliente desde el {{ formatDate(memberSince) }}</p>
      </div>

      <div class="account-grid">
        <label class="form-field">
          Nombre
          <input v-model="form.nombre" name="nombre" autocomplete="given-name" required />
        </label>
        <label class="form-field">
          Apellido
          <input v-model="form.apellido" name="apellido" autocomplete="family-name" required />
        </label>
        <label class="form-field">
          Email
          <input v-model="form.email" type="email" name="email" autocomplete="email" required />
        </label>
        <label class="form-field">
          Teléfono
          <input v-model="form.telefono" type="tel" name="telefono" autocomplete="tel" required />
        </label>
      </div>

      <span class="eyebrow">DIRECCIÓN</span>
      <div class="account-grid">
        <label class="form-field span-2">
          Calle y número
          <input v-model="form.calle_numero" name="calle_numero" autocomplete="street-address" />
        </label>
        <label class="form-field">
          Ciudad
          <input v-model="form.ciudad" name="ciudad" autocomplete="address-level2" />
        </label>
        <label class="form-field">
          Código postal
          <input v-model="form.codigo_postal" name="codigo_postal" autocomplete="postal-code" />
        </label>
        <label class="form-field">
          País
          <input v-model="form.pais" name="pais" autocomplete="country-name" />
        </label>
      </div>

      <div v-if="saveError" class="form-error profile-error" role="alert">
        <p>{{ saveError }}</p>
        <ul v-if="fieldErrors.length">
          <li v-for="detail in fieldErrors" :key="detail">{{ detail }}</li>
        </ul>
      </div>
      <p v-if="saveSuccess" class="form-success-box" role="status">{{ saveSuccess }}</p>

      <button class="primary-button" type="submit" :disabled="saving">
        {{ saving ? 'Guardando…' : 'Guardar cambios' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.member-since {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 10px;
}

.profile-error {
  margin: 0;
}

.profile-error p {
  margin: 0;
}

.profile-error ul {
  margin: 6px 0 0;
  padding-left: 16px;
}

.retry-button {
  margin-top: 14px;
}
</style>
