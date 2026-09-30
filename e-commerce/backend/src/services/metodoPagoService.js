const metodoPagoModel = require("../models/metodoPagoModel");

const metodoPagoService = {
  async listarMetodosPago() {
    return await metodoPagoModel.getAll();
  },

  async obtenerMetodoPagoPorId(id) {
    const metodo = await metodoPagoModel.getById(id);
    if (!metodo) {
      throw new Error("Método de pago no encontrado");
    }
    return metodo;
  },

  async crearMetodoPago(data) {
    if (!data.nombre) {
      throw new Error("El nombre del método de pago es obligatorio");
    }
    return await metodoPagoModel.create(data);
  },

  async actualizarMetodoPago(id, data) {
    await metodoPagoService.obtenerMetodoPagoPorId(id); // Lanza error si no existe
    return await metodoPagoModel.update(id, data);
  },

  async eliminarMetodoPago(id) {
    await metodoPagoService.obtenerMetodoPagoPorId(id); // Lanza error si no existe
    return await metodoPagoModel.delete(id);
  },
};

module.exports = metodoPagoService;
