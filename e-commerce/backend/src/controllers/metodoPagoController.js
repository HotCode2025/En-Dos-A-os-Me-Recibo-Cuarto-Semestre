const metodoPagoService = require("../services/metodoPagoService");

const metodoPagoController = {
  async getMetodosPago(req, res) {
    try {
      const metodos = await metodoPagoService.listarMetodosPago();
      return res.status(200).json(metodos);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getMetodoPagoById(req, res) {
    try {
      const { id } = req.params;
      const metodo = await metodoPagoService.obtenerMetodoPagoPorId(id);
      return res.status(200).json(metodo);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },

  async crearMetodoPago(req, res) {
    try {
      const nuevoMetodo = await metodoPagoService.crearMetodoPago(req.body);
      return res.status(201).json({
        mensaje: "Método de pago creado exitosamente",
        metodoPago: nuevoMetodo,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async actualizarMetodoPago(req, res) {
    try {
      const { id } = req.params;
      const metodoActualizado = await metodoPagoService.actualizarMetodoPago(
        id,
        req.body,
      );
      return res.status(200).json({
        mensaje: "Método de pago actualizado exitosamente",
        metodoPago: metodoActualizado,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async eliminarMetodoPago(req, res) {
    try {
      const { id } = req.params;
      await metodoPagoService.eliminarMetodoPago(id);
      return res
        .status(200)
        .json({ mensaje: "Método de pago eliminado exitosamente" });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  },
};

module.exports = metodoPagoController;
