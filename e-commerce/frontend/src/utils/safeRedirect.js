// Devuelve un destino de redirección seguro: solo rutas internas ("/algo"), nunca URLs externas ni "//host".
function safeRedirect(value, fallback = '/') {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}

export { safeRedirect }
