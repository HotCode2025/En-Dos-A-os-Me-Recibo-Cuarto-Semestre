const ordenModel = require("../models/ordenModel");
const metodoPagoModel = require("../models/metodoPagoModel");
const pagoService = require("./pagoService");
const HttpError = require("../utils/httpError");

// Estados a los que puede pasar cada estado. Entregado y Cancelado son finales.
const TRANSICIONES = {
  Pendiente: ["Pagado", "Cancelado"],
  Pagado: ["Enviado", "Cancelado"],
  Enviado: ["Entregado"],
  Entregado: [],
  Cancelado: [],
};

const esTransicionValida = (estadoActual, nuevoEstado) =>
  (TRANSICIONES[estadoActual] || []).includes(nuevoEstado);

const ordenService = {
  crearOrdenDesdeCarrito: async (usuarioId, metodoPagoId) => {
    const metodoPago = await metodoPagoModel.getById(metodoPagoId);
    if (!metodoPago || !metodoPago.activo) {
      throw new HttpError(400, "El método de pago no existe o no está disponible");
    }

    // El stock, el total y el vaciado del carrito se resuelven dentro de una única transacción
    const { orden, items } = await ordenModel.crearOrdenTransaccional(usuarioId, metodoPagoId);

    return {
      mensaje: "Orden creada exitosamente",
      orden,
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
    const estadosPermitidos = Object.keys(TRANSICIONES);

    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(
        `Estado inválido. Los estados permitidos son: ${estadosPermitidos.join(", ")}`,
      );
    }

    const { orden, estadoAnterior } = await ordenModel.actualizarEstadoOrden(
      ordenId,
      nuevoEstado,
      esTransicionValida,
    );

    // La cancelación ya quedó guardada; si falla el reembolso se avisa para hacerlo a mano
    if (nuevoEstado === "Cancelado" && estadoAnterior === "Pagado") {
      try {
        const reembolsos = await pagoService.reembolsarPagosAprobadosDeOrden(orden.id);
        return { orden, reembolsos };
      } catch (error) {
        console.error(`No se pudo reembolsar la orden #${orden.id}:`, error);
        throw new HttpError(
          502,
          `La orden #${orden.id} se canceló, pero no se pudo reembolsar el pago en Mercado Pago. Debe reembolsarse manualmente desde el panel de Mercado Pago.`,
        );
      }
    }

    return { orden, reembolsos: [] };
  },
};

module.exports = ordenService;
