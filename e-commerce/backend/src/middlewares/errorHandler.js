const HttpError = require("../utils/httpError");

// Contrato de errores de la API: siempre { error: "<mensaje>" } y, si corresponde, un `code`.

// Para rutas que ningún router resolvió.
function noEncontrado(req, res) {
  res.status(404).json({ error: "Ruta no encontrada." });
}

// Se registra al final de la app. Express 5 reenvía acá las promesas rechazadas de los controllers.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Si la respuesta ya empezó, Express debe cerrar la conexión por su cuenta.
  if (res.headersSent) return next(err);

  // Error de negocio lanzado a propósito con su status.
  if (err instanceof HttpError) {
    const cuerpo = { error: err.message };
    if (err.code) cuerpo.code = err.code;
    return res.status(err.status).json(cuerpo);
  }

  // Violación de unicidad o de clave foránea en PostgreSQL: nunca se expone el mensaje crudo.
  if (err && (err.code === "23505" || err.code === "23503")) {
    return res.status(409).json({
      error:
        err.code === "23505"
          ? "Ya existe un registro con esos datos."
          : "La operación entra en conflicto con registros relacionados.",
    });
  }

  // JSON mal formado en el body.
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
  }

  console.error("Error no controlado:", err);
  return res.status(500).json({ error: "Error interno del servidor." });
}

module.exports = { errorHandler, noEncontrado };
