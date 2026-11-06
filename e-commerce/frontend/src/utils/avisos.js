// Canal simple para mostrar el aviso (toast) de App.vue desde cualquier vista o servicio.
const EVENTO_AVISO = 'puntozero:aviso'

// `link` opcional: { to, label }
function avisar(message, link = null) {
  window.dispatchEvent(new CustomEvent(EVENTO_AVISO, { detail: { message, link } }))
}

export { EVENTO_AVISO, avisar }
