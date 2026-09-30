const carritoService = require("../services/carritoService");

const carritoController = {
  // Obtiene el carrito del usuario autenticado
  getMiCarrito: async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      const carrito = await carritoService.getCarritoByUsuario(usuarioId);
      res.status(200).json(carrito);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Agrega un producto al carrito
  agregarProducto: async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      const { productoId, cantidad } = req.body;

      if (!productoId || !cantidad) {
        return res
          .status(400)
          .json({ error: "El producto y la cantidad son obligatorios" });
      }

      const itemAgregado = await carritoService.agregarItem(
        usuarioId,
        productoId,
        cantidad,
      );

      res.status(201).json({
        mensaje: "Producto agregado al carrito exitosamente",
        datos: itemAgregado,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  // Resta la cantidad de un producto en el carrito
  restarProducto: async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      const { productoId, cantidad } = req.body;

      if (!productoId || !cantidad) {
        return res
          .status(400)
          .json({ error: "El productoId y la cantidad son obligatorios" });
      }

      const itemRestado = await carritoService.restarItem(
        usuarioId,
        productoId,
        cantidad,
      );

      res.status(200).json({
        mensaje: "Cantidad restada exitosamente",
        datos: itemRestado,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Elimina un producto por completo del carrito
  quitarProducto: async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      const { productoId } = req.params;

      if (!productoId) {
        return res
          .status(400)
          .json({ error: "El ID del producto es obligatorio" });
      }

      await carritoService.quitarItem(usuarioId, productoId);

      res.status(200).json({
        mensaje: "Producto eliminado del carrito exitosamente",
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = carritoController;
