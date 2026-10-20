const inventarioModel = require("../models/InventarioModel");

const inventarioController = {
  async getAll(req, res) {
    try {
      const productos = await inventarioModel.getAll();
      return res.status(200).json(productos);
    } catch (error) {
      console.error("Error al consultar inventario:", error);
      return res.status(500).json({
        error: "No se pudo consultar el inventario."
      });
    }
  },

  async getById(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "El ID debe ser un número entero positivo."
      });
    }

    try {
      const producto = await inventarioModel.getById(id);

      if (!producto) {
        return res.status(404).json({
          error: "Producto no encontrado."
        });
      }

      return res.status(200).json(producto);
    } catch (error) {
      console.error("Error al consultar stock:", error);
      return res.status(500).json({
        error: "No se pudo consultar el stock."
      });
    }
  },

  async updateStock(req, res) {
    const id = Number(req.params.id);
    const { stock } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "El ID debe ser un número entero positivo."
      });
    }

    if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        error: "El stock debe ser un número entero mayor o igual a cero."
      });
    }

    try {
      const producto = await inventarioModel.updateStock(id, stock);

      if (!producto) {
        return res.status(404).json({
          error: "Producto no encontrado."
        });
      }

      return res.status(200).json({
        mensaje: "Stock actualizado correctamente.",
        producto
      });
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      return res.status(500).json({
        error: "No se pudo actualizar el stock."
      });
    }
  }
};

module.exports = inventarioController;
