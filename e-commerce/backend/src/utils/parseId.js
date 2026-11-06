const HttpError = require("./httpError");

// Convierte un ID recibido por URL o body en un entero positivo; si no lo es, lanza HttpError 400.
function parseId(valor, mensaje = "El ID debe ser un número entero positivo.") {
  const id = Number(valor);
  if (valor === null || valor === "" || !Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, mensaje);
  }
  return id;
}

module.exports = { parseId };
