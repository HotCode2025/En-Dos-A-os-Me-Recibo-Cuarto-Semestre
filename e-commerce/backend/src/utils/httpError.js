// Error de negocio con código HTTP asociado, para que el controlador responda el status correcto.
class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

module.exports = HttpError;
