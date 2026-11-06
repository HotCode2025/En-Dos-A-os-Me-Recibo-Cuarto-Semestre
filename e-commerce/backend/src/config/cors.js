const ORIGENES_POR_DEFECTO = ["http://localhost:5173", "http://localhost:3000"];

const normalizar = (url) => url.trim().replace(/\/+$/, "");

// CORS_ORIGIN (lista separada por comas) reemplaza los orígenes locales; FRONTEND_URL siempre se permite.
function obtenerOrigenesPermitidos(env = process.env) {
  const configurados = (env.CORS_ORIGIN || "").split(",").map(normalizar).filter(Boolean);
  const origenes = configurados.length ? configurados : [...ORIGENES_POR_DEFECTO];
  if (env.FRONTEND_URL) origenes.push(normalizar(env.FRONTEND_URL));
  return [...new Set(origenes)];
}

module.exports = { obtenerOrigenesPermitidos };
