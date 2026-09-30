const carritoModel = require("../models/carritoModel");

const carritoService = {
  getCarritoByUsuario: async (usuarioId) => {
    const carritoId = await carritoModel.obtenerCarritoPorUsuario(usuarioId);
    const items = await carritoModel.obtenerItemsCarrito(carritoId);

    const total = items.reduce(
      (acc, item) => acc + parseFloat(item.subtotal),
      0,
    );

    return {
      carritoId,
      usuarioId,
      items,
      total,
    };
  },

  agregarItem: async (usuarioId, productoId, cantidad) => {
    const carritoId = await carritoModel.obtenerCarritoPorUsuario(usuarioId);

    const producto = await carritoModel.obtenerProductoPorId(productoId);
    if (!producto) {
      throw new Error("El producto no existe en el catálogo");
    }

    const itemExistente = await carritoModel.buscarItemEnCarrito(
      carritoId,
      productoId,
    );

    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidad;
      return await carritoModel.actualizarCantidadItem(
        itemExistente.id,
        nuevaCantidad,
      );
    } else {
      return await carritoModel.agregarItemNuevo(
        carritoId,
        productoId,
        cantidad,
      );
    }
  },
};

module.exports = carritoService;
