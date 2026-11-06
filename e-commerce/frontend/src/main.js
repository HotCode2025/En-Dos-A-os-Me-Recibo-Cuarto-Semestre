import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/api'
import { logout } from './stores/auth'

// Sesión vencida o token alterado (401 con token): se cierra la sesión y se vuelve al login,
// recordando la página actual para regresar después de autenticarse.
setUnauthorizedHandler(() => {
  logout()
  const current = router.currentRoute.value
  if (current.path === '/login') return
  router.push({ path: '/login', query: { redirect: current.fullPath } })
})

createApp(App).use(router).mount('#app')
