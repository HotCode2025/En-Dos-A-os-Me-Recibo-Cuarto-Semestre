const ordenService = require("../services/ordenService");

const ordenController = {
  crearOrden: async (req, res) => {
    try {
      const usuarioId = req.usuario.id; // Extraído del token JWT
      const { direccionId, metodoPagoId } = req.body;

      if (!direccionId || !metodoPagoId) {
        return res.status(400).json({
          error: "Faltan datos obligatorios: direccionId y metodoPagoId",
        });
      }

      const resultado = await ordenService.crearOrdenDesdeCarrito(
        usuarioId,
        direccionId,
        metodoPagoId,
      );
      return res.status(201).json(resultado);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  getMisOrdenes: async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      const ordenes = await ordenService.getMisOrdenes(usuarioId);
      return res.status(200).json(ordenes);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  getAllOrdenes: async (req, res) => {
    try {
      const ordenes = await ordenService.getAllOrdenes();
      return res.status(200).json(ordenes);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  actualizarEstado: async (req, res) => {
    try {
      const ordenId = req.params.id;
      const { nuevoEstado } = req.body;

      if (!nuevoEstado) {
        return res
          .status(400)
          .json({ error: "El campo nuevoEstado es obligatorio" });
      }

      const ordenActualizada = await ordenService.actualizarEstado(
        ordenId,
        nuevoEstado,
      );

      return res.status(200).json({
        mensaje: "Estado de la orden actualizado exitosamente",
        orden: ordenActualizada,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};

module.exports = ordenController;
