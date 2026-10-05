const ordenModel = require("../models/ordenModel");
const carritoModel = require("../models/carritoModel");

const ordenService = {
  crearOrdenDesdeCarrito: async (usuarioId, metodoPagoId) => {
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

  actualizarEstado: async (ordenId, nuevoEstado) => {
    // Validamos que el estado sea uno de los permitidos por tu lógica de negocio
    const estadosPermitidos = [
      "Pendiente",
      "Pagado",
      "Enviado",
      "Entregado",
      "Cancelado",
    ];

    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(
        `Estado inválido. Los estados permitidos son: ${estadosPermitidos.join(", ")}`,
      );
    }

    const ordenActualizada = await ordenModel.actualizarEstadoOrden(
      ordenId,
      nuevoEstado,
    );

    if (!ordenActualizada) {
      throw new Error("La orden especificada no existe");
    }

    return ordenActualizada;
  },
};

module.exports = ordenService;
