<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { login } from '../stores/auth'
import { loginRequest, registerRequest } from '../services/auth'
import { sincronizarTrasLogin } from '../services/ordenes'
import { safeRedirect } from '../utils/safeRedirect'

const route = useRoute()
const router = useRouter()
const form = reactive({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  password: '',
  passwordRepeat: '',
})
const errorMessage = ref('')
const fieldErrors = ref([])
const isSubmitting = ref(false)

const PHONE_FORMAT = /^\+?[\d\s-]{6,20}$/
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Misma validación que el backend (validarUsuario.nuevoUsuario). Devuelve la lista de problemas.
function validateForm() {
  const problems = []
  if (!form.nombre.trim()) problems.push('El nombre es requerido.')
  if (!form.apellido.trim()) problems.push('El apellido es requerido.')
  if (!EMAIL_FORMAT.test(form.email.trim())) problems.push('Ingresá un email con formato válido.')
  const phone = form.telefono.trim()
  if (!PHONE_FORMAT.test(phone) || phone.replace(/\D/g, '').length < 6) {
    problems.push('El teléfono debe tener entre 6 y 20 caracteres: dígitos, espacios o guiones, con un + opcional al inicio.')
  }
  if (form.password.length < 5) problems.push('La contraseña debe tener al menos 5 caracteres.')
  if (form.password !== form.passwordRepeat) problems.push('Las contraseñas no coinciden.')
  return problems
}

async function submitRegister() {
  errorMessage.value = ''
  fieldErrors.value = []

  const problems = validateForm()
  if (problems.length) {
    errorMessage.value = 'Revisá los datos ingresados.'
    fieldErrors.value = problems
    return
  }

  isSubmitting.value = true
  try {
    await registerRequest({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      password: form.password,
    })
  } catch (error) {
    showRegisterError(error)
    isSubmitting.value = false
    return
  }

  // La cuenta ya existe: inicio de sesión automático y vuelta a donde estaba el usuario.
  try {
    const session = await loginRequest(form.email.trim(), form.password)
    login(session)
    sincronizarTrasLogin()
    await router.push(safeRedirect(route.query.redirect))
  } catch (error) {
    console.error('La cuenta se creó pero no se pudo iniciar sesión:', error)
    await router.push({ path: '/login', query: route.query.redirect ? { redirect: route.query.redirect } : {} })
  } finally {
    isSubmitting.value = false
  }
}

function showRegisterError(error) {
  if (error instanceof TypeError) {
    errorMessage.value = 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
    return
  }
  errorMessage.value = error.message
  // En un 400 de validación el backend manda el detalle por campo en `tipo`.
  const details = Array.isArray(error.data?.tipo) ? error.data.tipo : []
  fieldErrors.value = details.map((detail) => detail.msg).filter(Boolean)
}
</script>

<template>
  <section class="login-page">
    <div class="login-card register-card">
      <div class="login-heading">
        <span class="brand-mark" aria-hidden="true">P</span>
        <span class="eyebrow">TU ESPACIO PUNTOZERO</span>
        <h1>Creá tu cuenta<span>.</span></h1>
        <p>Registrate para comprar y seguir tus órdenes.</p>
      </div>

      <form class="login-form" novalidate @submit.prevent="submitRegister">
        <div class="form-row">
          <label class="form-field">
            Nombre
            <input v-model.trim="form.nombre" name="nombre" autocomplete="given-name" placeholder="Ana" required />
          </label>
          <label class="form-field">
            Apellido
            <input
              v-model.trim="form.apellido"
              name="apellido"
              autocomplete="family-name"
              placeholder="Pérez"
              required
            />
          </label>
        </div>
        <label class="form-field">
          Email
          <input
            v-model.trim="form.email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="tu@email.com"
            required
          />
        </label>
        <label class="form-field">
          Teléfono
          <input
            v-model.trim="form.telefono"
            type="tel"
            name="telefono"
            autocomplete="tel"
            placeholder="+54 11 1234-5678"
            required
          />
        </label>
        <label class="form-field">
          Contraseña
          <input
            v-model="form.password"
            type="password"
            name="password"
            autocomplete="new-password"
            placeholder="Mínimo 5 caracteres"
            required
          />
        </label>
        <label class="form-field">
          Repetí la contraseña
          <input
            v-model="form.passwordRepeat"
            type="password"
            name="passwordRepeat"
            autocomplete="new-password"
            placeholder="Repetí tu contraseña"
            required
          />
        </label>

        <div v-if="errorMessage" class="form-error" role="alert">
          <p>{{ errorMessage }}</p>
          <ul v-if="fieldErrors.length" class="form-error-list">
            <li v-for="detail in fieldErrors" :key="detail">{{ detail }}</li>
          </ul>
        </div>

        <button class="primary-button login-submit" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creando cuenta…' : 'Crear cuenta' }}
          <span v-if="!isSubmitting" aria-hidden="true">→</span>
        </button>
      </form>

      <p class="login-switch">
        ¿Ya tenés cuenta?
        <RouterLink :to="{ path: '/login', query: route.query.redirect ? { redirect: route.query.redirect } : {} }">
          Ingresá
        </RouterLink>
      </p>
      <RouterLink class="login-back-link" to="/">← Volver a la tienda</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.register-card {
  width: min(100%, 480px);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-error p {
  margin: 0;
}

.form-error-list {
  margin: 6px 0 0;
  padding-left: 16px;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
