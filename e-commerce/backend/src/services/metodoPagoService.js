const metodoPagoModel = require("../models/metodoPagoModel");
const HttpError = require("../utils/httpError");

const metodoPagoService = {
  async listarMetodosPago() {
    // Los clientes solo ven los métodos que pueden usar
    return await metodoPagoModel.getAll({ soloActivos: true });
  },

  // Para el panel de administración: incluye los métodos desactivados
  async listarTodosMetodosPago() {
    return await metodoPagoModel.getAll();
  },

  async obtenerMetodoPagoPorId(id) {
    const metodo = await metodoPagoModel.getById(id);
    if (!metodo) {
      throw new HttpError(404, "Método de pago no encontrado");
    }
    return metodo;
  },

  async crearMetodoPago(data) {
    const datos = data ?? {};
    if (!datos.nombre) {
      throw new Error("El nombre del método de pago es obligatorio");
    }
    return await metodoPagoModel.create(datos);
  },

  async actualizarMetodoPago(id, data) {
    const datos = data ?? {};
    if (datos.activo !== undefined && typeof datos.activo !== "boolean") {
      throw new HttpError(400, "El campo activo debe ser verdadero o falso");
    }
    await metodoPagoService.obtenerMetodoPagoPorId(id); // Lanza error si no existe
    return await metodoPagoModel.update(id, datos);
  },

  async eliminarMetodoPago(id) {
    await metodoPagoService.obtenerMetodoPagoPorId(id); // Lanza error si no existe
    return await metodoPagoModel.delete(id);
  },
};

module.exports = metodoPagoService;
