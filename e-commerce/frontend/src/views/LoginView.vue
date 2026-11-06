<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { login } from '../stores/auth'
import { loginRequest } from '../services/auth'
import { sincronizarTrasLogin } from '../services/ordenes'
import { safeRedirect } from '../utils/safeRedirect'

const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function submitLogin() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const session = await loginRequest(email.value, password.value)

    login(session)
    sincronizarTrasLogin()
    await router.push(safeRedirect(route.query.redirect))
  } catch (error) {
    errorMessage.value =
      error instanceof TypeError
        ? 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado.'
        : error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <div class="login-heading">
        <span class="brand-mark" aria-hidden="true">P</span>
        <span class="eyebrow">TU ESPACIO PUNTOZERO</span>
        <h1>Qué bueno verte<span>.</span></h1>
        <p>Ingresá para acceder a tu cuenta.</p>
      </div>

      <form class="login-form" @submit.prevent="submitLogin">
        <label class="form-field">
          Email
          <input
            v-model.trim="email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="tu@email.com"
            required
          />
        </label>
        <label class="form-field">
          Contraseña
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="Tu contraseña"
            required
          />
        </label>
        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
        <button class="primary-button login-submit" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Ingresando…' : 'Iniciar sesión' }}
          <span v-if="!isSubmitting" aria-hidden="true">→</span>
        </button>
      </form>

      <p class="login-switch">
        ¿No tenés cuenta?
        <RouterLink :to="{ path: '/registro', query: route.query.redirect ? { redirect: route.query.redirect } : {} }">
          Registrate
        </RouterLink>
      </p>
      <p class="login-forgot">¿Olvidaste tu contraseña? Contactá al administrador de la tienda.</p>
      <RouterLink class="login-back-link" to="/">← Volver a la tienda</RouterLink>
    </div>
  </section>
</template>
