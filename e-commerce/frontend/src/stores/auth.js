import { computed, ref } from 'vue'

const storedSession = sessionStorage.getItem('puntozero-session')
let initialSession = null

if (storedSession) {
  try {
    const parsedSession = JSON.parse(storedSession)
    if (parsedSession?.token && parsedSession?.usuario?.rol) {
      initialSession = parsedSession
    } else {
      sessionStorage.removeItem('puntozero-session')
    }
  } catch (error) {
    console.warn('La sesión guardada no es válida y se cerrará.', error)
    sessionStorage.removeItem('puntozero-session')
  }
}

const session = ref(initialSession)
const currentUser = computed(() => session.value?.usuario ?? null)
const isAdmin = computed(() => currentUser.value?.rol === 'ADMIN')
const accessToken = computed(() => session.value?.token ?? '')

function login(authenticatedSession) {
  sessionStorage.setItem('puntozero-session', JSON.stringify(authenticatedSession))
  session.value = authenticatedSession
}

function logout() {
  sessionStorage.removeItem('puntozero-session')
  session.value = null
}

export { accessToken, currentUser, isAdmin, login, logout }
