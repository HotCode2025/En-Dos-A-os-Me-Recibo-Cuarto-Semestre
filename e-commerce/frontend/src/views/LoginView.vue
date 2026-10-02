<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { login } from '../stores/auth'

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
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    let result
    try {
      result = await response.json()
    } catch {
      throw new Error('El servidor devolvió una respuesta inválida.')
    }

    if (!response.ok) {
      throw new Error(result.error || 'No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo.')
    }
    if (!result.token || !result.usuario?.rol) {
      throw new Error('El servidor respondió sin los datos de sesión esperados.')
    }
    if (!['ADMIN', 'CLIENTE'].includes(result.usuario.rol)) {
      throw new Error('El servidor devolvió un rol de usuario no reconocido.')
    }

    login({ token: result.token, usuario: result.usuario })
    const destination = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(destination)
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

      <button class="login-forgot" type="button">¿Olvidaste tu contraseña?</button>
      <RouterLink class="login-back-link" to="/">← Volver a la tienda</RouterLink>
    </div>
  </section>
</template>
