const ordenService = require("../services/ordenService");
const { responderError } = require("../utils/responderError");
const { parseId } = require("../utils/parseId");

const ordenController = {
  crearOrden: async (req, res, next) => {
    try {
      const usuarioId = req.usuario.id; // Extraído del token JWT
      const { metodoPagoId } = req.body ?? {};

      if ( !metodoPagoId) {
        return res.status(400).json({
          error: "Faltan datos obligatorio: metodoPagoId",
        });
      }
      if (!Number.isInteger(Number(metodoPagoId)) || Number(metodoPagoId) <= 0) {
        return res.status(400).json({ error: "El metodoPagoId debe ser un entero positivo" });
      }

      const resultado = await ordenService.crearOrdenDesdeCarrito(
        usuarioId,
        Number(metodoPagoId),
      );
      return res.status(201).json(resultado);
    } catch (error) {
      return responderError(error, res, next);
    }
  },

  getMisOrdenes: async (req, res, next) => {
    try {
      const usuarioId = req.usuario.id;
      const ordenes = await ordenService.getMisOrdenes(usuarioId);
      return res.status(200).json(ordenes);
    } catch (error) {
      return responderError(error, res, next);
    }
  },

  getAllOrdenes: async (req, res, next) => {
    try {
      const ordenes = await ordenService.getAllOrdenes();
      return res.status(200).json(ordenes);
    } catch (error) {
      return responderError(error, res, next);
    }
  },

  actualizarEstado: async (req, res, next) => {
    try {
      const ordenId = parseId(req.params.id);
      const { nuevoEstado } = req.body ?? {};

      if (!nuevoEstado) {
        return res
          .status(400)
          .json({ error: "El campo nuevoEstado es obligatorio" });
      }

      const { orden, reembolsos } = await ordenService.actualizarEstado(
        ordenId,
        nuevoEstado,
      );

      return res.status(200).json({
        mensaje: "Estado de la orden actualizado exitosamente",
        orden,
        reembolsos,
      });
    } catch (error) {
      return responderError(error, res, next);
    }
  },
};

module.exports = ordenController;
