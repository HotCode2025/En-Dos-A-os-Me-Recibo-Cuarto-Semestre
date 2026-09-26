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
};

module.exports = carritoController;
