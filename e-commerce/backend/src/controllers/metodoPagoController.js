const metodoPagoService = require("../services/metodoPagoService");
const { responderError } = require("../utils/responderError");
const { parseId } = require("../utils/parseId");

const metodoPagoController = {
  async getMetodosPago(req, res, next) {
    try {
      const metodos = await metodoPagoService.listarMetodosPago();
      return res.status(200).json(metodos);
    } catch (error) {
      return responderError(error, res, next, 500);
    }
  },

  // Solo ADMIN: lista también los métodos desactivados
  async getTodosMetodosPago(req, res, next) {
    try {
      const metodos = await metodoPagoService.listarTodosMetodosPago();
      return res.status(200).json(metodos);
    } catch (error) {
      return responderError(error, res, next, 500);
    }
  },

  async getMetodoPagoById(req, res, next) {
    try {
      const id = parseId(req.params.id);
      const metodo = await metodoPagoService.obtenerMetodoPagoPorId(id);
      return res.status(200).json(metodo);
    } catch (error) {
      return responderError(error, res, next, 404);
    }
  },

  async crearMetodoPago(req, res, next) {
    try {
      const nuevoMetodo = await metodoPagoService.crearMetodoPago(req.body ?? {});
      return res.status(201).json({
        mensaje: "Método de pago creado exitosamente",
        metodoPago: nuevoMetodo,
      });
    } catch (error) {
      return responderError(error, res, next);
    }
  },

  async actualizarMetodoPago(req, res, next) {
    try {
      const id = parseId(req.params.id);
      const metodoActualizado = await metodoPagoService.actualizarMetodoPago(
        id,
        req.body ?? {},
      );
      return res.status(200).json({
        mensaje: "Método de pago actualizado exitosamente",
        metodoPago: metodoActualizado,
      });
    } catch (error) {
      return responderError(error, res, next);
    }
  },

  async eliminarMetodoPago(req, res, next) {
    try {
      const id = parseId(req.params.id);
      await metodoPagoService.eliminarMetodoPago(id);
      return res
        .status(200)
        .json({ mensaje: "Método de pago desactivado exitosamente" });
    } catch (error) {
      return responderError(error, res, next, 404);
    }
  },
};

module.exports = metodoPagoController;
