const ordenModel = require("../models/ordenModel");
const carritoModel = require("../models/carritoModel");

const ordenService = {
  crearOrdenDesdeCarrito: async (usuarioId, direccionId, metodoPagoId) => {
    const carritoId = await carritoModel.obtenerCarritoPorUsuario(usuarioId);
    const items = await carritoModel.obtenerItemsCarrito(carritoId);

    if (!items || items.length === 0) {
      throw new Error("El carrito está vacío. No se puede generar una orden.");
    }

    const total = items.reduce(
      (acc, item) => acc + parseFloat(item.subtotal),
      0,
    );

    const nuevaOrden = await ordenModel.crearOrdenTransaccional(
      usuarioId,
      direccionId,
      metodoPagoId,
      items,
      total,
    );

    return {
      mensaje: "Orden creada exitosamente",
      orden: nuevaOrden,
      items,
    };
  },

  getMisOrdenes: async (usuarioId) => {
    return await ordenModel.obtenerOrdenesPorUsuario(usuarioId);
  },

  getAllOrdenes: async () => {
    return await ordenModel.obtenerTodasLasOrdenes();
  },
};

module.exports = ordenService;
