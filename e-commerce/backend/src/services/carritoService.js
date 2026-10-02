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
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error("La cantidad debe ser un entero mayor que cero");
    }

    const carritoId = await carritoModel.obtenerCarritoPorUsuario(usuarioId);

    const producto = await carritoModel.obtenerProductoPorId(productoId);
    if (!producto) {
      throw new Error("El producto no existe en el catálogo");
    }

    const itemExistente = await carritoModel.buscarItemEnCarrito(
      carritoId,
      productoId,
    );

    const cantidadActual = itemExistente ? itemExistente.cantidad : 0;
    if (cantidadActual + cantidad > producto.stock) {
      throw new Error("No hay stock suficiente para esa cantidad");
    }

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
  restarItem: async (usuarioId, productoId, cantidad) => {
    const carritoId = await carritoModel.obtenerCarritoPorUsuario(usuarioId);

    const itemExistente = await carritoModel.buscarItemEnCarrito(
      carritoId,
      productoId,
    );

    if (!itemExistente) {
      throw new Error("El producto no se encuentra en el carrito");
    }

    const nuevaCantidad = itemExistente.cantidad - cantidad;

    if (nuevaCantidad <= 0) {
      // Si al restar la cantidad llega a 0 o menos, lo eliminamos directamente
      return await carritoModel.eliminarItem(itemExistente.id);
    } else {
      // Si aún queda cantidad, simplemente la actualizamos
      return await carritoModel.actualizarCantidadItem(
        itemExistente.id,
        nuevaCantidad,
      );
    }
  },

  quitarItem: async (usuarioId, productoId) => {
    const carritoId = await carritoModel.obtenerCarritoPorUsuario(usuarioId);

    const itemExistente = await carritoModel.buscarItemEnCarrito(
      carritoId,
      productoId,
    );

    if (!itemExistente) {
      throw new Error("El producto no se encuentra en el carrito");
    }

    // Eliminamos el producto por completo sin importar la cantidad
    return await carritoModel.eliminarItem(itemExistente.id);
  },
};

module.exports = carritoService;
