const carritoService = require("../services/carritoService");
const { responderError } = require("../utils/responderError");

const carritoController = {
  // Obtiene el carrito del usuario autenticado
  getMiCarrito: async (req, res, next) => {
    try {
      const usuarioId = req.usuario.id;
      const carrito = await carritoService.getCarritoByUsuario(usuarioId);
      res.status(200).json(carrito);
    } catch (error) {
      responderError(error, res, next);
    }
  },

  // Agrega un producto al carrito
  agregarProducto: async (req, res, next) => {
    try {
      const usuarioId = req.usuario.id;
      const { productoId, cantidad } = req.body ?? {};

      if (
        !Number.isInteger(productoId) ||
        productoId <= 0 ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        return res
          .status(400)
          .json({
            error: "El producto y una cantidad entera mayor que cero son obligatorios",
          });
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
      responderError(error, res, next);
    }
  },
  // Resta la cantidad de un producto en el carrito
  restarProducto: async (req, res, next) => {
    try {
      const usuarioId = req.usuario.id;
      const { productoId, cantidad } = req.body ?? {};

      if (
        !Number.isInteger(productoId) ||
        productoId <= 0 ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        return res
          .status(400)
          .json({
            error: "El productoId y una cantidad entera mayor que cero son obligatorios",
          });
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
      responderError(error, res, next);
    }
  },

  // Elimina un producto por completo del carrito
  quitarProducto: async (req, res, next) => {
    try {
      const usuarioId = req.usuario.id;
      const productoId = Number(req.params.productoId);

      if (!req.params.productoId) {
        return res
          .status(400)
          .json({ error: "El ID del producto es obligatorio" });
      }
      if (!Number.isInteger(productoId) || productoId <= 0) {
        return res
          .status(400)
          .json({ error: "El ID del producto debe ser un entero positivo" });
      }

      await carritoService.quitarItem(usuarioId, productoId);

      res.status(200).json({
        mensaje: "Producto eliminado del carrito exitosamente",
      });
    } catch (error) {
      responderError(error, res, next);
    }
  },
};

module.exports = carritoController;
