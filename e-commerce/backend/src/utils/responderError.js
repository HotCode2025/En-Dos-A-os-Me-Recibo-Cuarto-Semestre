const HttpError = require("./httpError");

// Los errores de PostgreSQL traen un `code` SQLSTATE de 5 caracteres (ej. 23505, 42P01).
function esErrorDePostgres(error) {
  return Boolean(error) && typeof error.code === "string" && /^[0-9A-Z]{5}$/.test(error.code);
}

/**
 * Resuelve el error de un controller sin filtrar detalles internos:
 * - HttpError (o error con status) -> responde con su status y mensaje.
 * - Error de pg, rechazo que no es Error o error sin mensaje -> next(error), que lo resuelve el errorHandler.
 * - Error de negocio común (los servicios aún lanzan Error con mensaje en español) -> statusPorDefecto.
 */
function responderError(error, res, next, statusPorDefecto = 400) {
  if (error instanceof HttpError || (error && Number.isInteger(error.status) && !esErrorDePostgres(error))) {
    return res.status(error.status).json({ error: error.message });
  }
  if (!(error instanceof Error) || !error.message || esErrorDePostgres(error)) {
    return next(error);
  }
  return res.status(statusPorDefecto).json({ error: error.message });
}

module.exports = { responderError, esErrorDePostgres };
