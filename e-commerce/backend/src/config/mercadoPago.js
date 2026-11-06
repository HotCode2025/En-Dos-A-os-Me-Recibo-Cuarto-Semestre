const { MercadoPagoConfig } = require("mercadopago");

const HOSTS_LOCALES = ["localhost", "127.0.0.1", "[::1]", "::1"];

let cliente = null;
let tokenDelCliente = null;

// Devuelve el cliente de Mercado Pago o null si MP_ACCESS_TOKEN no está configurado.
function obtenerClienteMercadoPago() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  if (!cliente || tokenDelCliente !== token) {
    cliente = new MercadoPagoConfig({ accessToken: token });
    tokenDelCliente = token;
  }
  return cliente;
}

// El SDK copia los requestOptions dentro de la configuración que recibe, así que una opción
// puntual (como una clave de idempotencia) necesita su propia configuración para no
// filtrarse a los pedidos siguientes del cliente compartido.
function crearClienteMercadoPagoAislado(opciones) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  return new MercadoPagoConfig({ accessToken: token, options: opciones });
}

function obtenerFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
}

function obtenerBackendPublicUrl() {
  return (process.env.BACKEND_PUBLIC_URL || "https://ecommerce-backend-21u2.onrender.com/api/v1").replace(/\/+$/, "");
}

// Mercado Pago no acepta dominios locales en back_urls con auto_return.
function esUrlLocal(url) {
  try {
    return HOSTS_LOCALES.includes(new URL(url).hostname);
  } catch {
    return true;
  }
}

module.exports = {
  obtenerClienteMercadoPago,
  crearClienteMercadoPagoAislado,
  obtenerFrontendUrl,
  obtenerBackendPublicUrl,
  esUrlLocal,
};
