// Formato aceptado para el teléfono: + opcional al inicio y luego dígitos, espacios o guiones.
const FORMATO_TELEFONO = /^\+?[\d\s-]{6,20}$/;
const MINIMO_DIGITOS = 6;

function normalizarEmail(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

// Deja solo los dígitos y conserva el + inicial si lo había: "+54 11 1234-5678" -> "+541112345678".
function normalizarTelefono(valor) {
  const texto = String(valor ?? "").trim();
  const digitos = texto.replace(/\D/g, "");
  return texto.startsWith("+") ? `+${digitos}` : digitos;
}

function telefonoValido(valor) {
  const texto = String(valor ?? "").trim();
  return FORMATO_TELEFONO.test(texto) && texto.replace(/\D/g, "").length >= MINIMO_DIGITOS;
}

module.exports = { normalizarEmail, normalizarTelefono, telefonoValido };
