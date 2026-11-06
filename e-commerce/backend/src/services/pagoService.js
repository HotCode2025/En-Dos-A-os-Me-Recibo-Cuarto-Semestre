const { Preference, Payment, PaymentRefund } = require("mercadopago");
const ordenModel = require("../models/ordenModel");
const HttpError = require("../utils/httpError");
const {
  obtenerClienteMercadoPago,
  crearClienteMercadoPagoAislado,
  obtenerFrontendUrl,
  obtenerBackendPublicUrl,
  esUrlLocal,
} = require("../config/mercadoPago");

const MONEDA = "ARS";

function clienteConfigurado() {
  const cliente = obtenerClienteMercadoPago();
  if (!cliente) {
    throw new HttpError(503, "Los pagos con Mercado Pago no están configurados en el servidor");
  }
  return cliente;
}

function aCentavos(monto) {
  return Math.round(Number(monto) * 100);
}

const esIdValido = (id) => Number.isInteger(id) && id > 0;

async function obtenerOrdenDelUsuario(usuarioId, ordenId) {
  const orden = esIdValido(ordenId) ? await ordenModel.obtenerOrdenConDetalle(ordenId) : null;
  if (!orden || Number(orden.id_usuario) !== Number(usuarioId)) {
    throw new HttpError(404, "La orden especificada no existe");
  }
  return orden;
}

// Devuelve el total de un pago cobrado para una orden que ya estaba cancelada.
// La clave de idempotencia evita un doble reembolso si el webhook y /confirmar llegan juntos.
// Va en un cliente aislado: pasada como requestOptions, el SDK la dejaría en el cliente compartido.
async function reembolsarPagoDeOrdenCancelada(pago, orden) {
  clienteConfigurado();
  const cliente = crearClienteMercadoPagoAislado({
    idempotencyKey: `reembolso-orden-cancelada-${pago.id}`,
  });
  await new PaymentRefund(cliente).total({ payment_id: pago.id });
  console.warn(`Pago ${pago.id} reembolsado: la orden #${orden.id} estaba cancelada`);
  return { orden, reembolsado: true };
}

// Marca la orden como pagada solo si el pago está aprobado y coincide en monto y moneda.
// Si la orden ya estaba cancelada, el pago aprobado se reembolsa completo.
async function aplicarPago(pago, orden) {
  if (pago.status !== "approved") return { orden, reembolsado: false };
  if (orden.estado === "Cancelado") return reembolsarPagoDeOrdenCancelada(pago, orden);

  const pagoValido =
    pago.currency_id === MONEDA && aCentavos(pago.transaction_amount) === aCentavos(orden.total);
  if (!pagoValido) return { orden, reembolsado: false };

  const ordenPagada = await ordenModel.marcarComoPagada(orden.id);
  if (ordenPagada) return { orden: ordenPagada, reembolsado: false };

  // null: la orden dejó de estar pendiente mientras tanto (ya pagada o recién cancelada)
  const ordenActual = (await ordenModel.obtenerOrdenConDetalle(orden.id)) || orden;
  if (ordenActual.estado === "Cancelado") return reembolsarPagoDeOrdenCancelada(pago, ordenActual);
  return { orden: ordenActual, reembolsado: false };
}

const DIAS_CONCILIACION = 7;
const CONCURRENCIA_CONCILIACION = 4;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Mismo criterio que el checkout: el nombre del método decide si el pago pasa por Mercado Pago.
// Comparte la fragilidad C12 de auditoria.md: depende del texto del nombre, no de un tipo de método.
function usaMercadoPago(nombre) {
  const minusculas = String(nombre || "").toLowerCase();
  return minusculas.includes("mercado pago") || minusculas.includes("tarjeta");
}

// Un pago de Mercado Pago se acredita en minutos: las pendientes más viejas se verifican a mano desde el admin.
function debeConciliarse(orden) {
  if (orden.estado !== "Pendiente" || !usaMercadoPago(orden.metodo_pago_nombre)) return false;
  const fecha = new Date(orden.fecha_pedido).getTime();
  return Number.isFinite(fecha) && Date.now() - fecha <= DIAS_CONCILIACION * MS_POR_DIA;
}

// aplicarPago necesita total, estado e id; marcarComoPagada trabaja por id. Los ítems no hacen falta.
function tieneLoNecesarioParaAplicarPago(orden) {
  return Boolean(orden) && orden.id != null && orden.estado != null && orden.total != null;
}

// Como Promise.all sobre un mapa, pero con como mucho `limite` tareas a la vez y manteniendo el orden.
// Cada tarea debe capturar sus propios errores: aquí se usa allSettled para que una falla no corte al resto.
async function mapearConConcurrencia(elementos, limite, tarea) {
  const resultados = new Array(elementos.length);
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < elementos.length) {
      const indice = siguiente++;
      resultados[indice] = await tarea(elementos[indice]);
    }
  };
  const trabajadores = Array.from({ length: Math.min(limite, elementos.length) }, trabajador);
  const liquidados = await Promise.allSettled(trabajadores);
  const fallido = liquidados.find((r) => r.status === "rejected");
  if (fallido) throw fallido.reason;
  return resultados;
}

async function consultarPago(paymentId) {
  const pago = await new Payment(clienteConfigurado()).get({ id: paymentId });
  return { pago, ordenId: Number(pago.external_reference) };
}

const pagoService = {
  async crearPreferencia(usuarioId, ordenId) {
    const cliente = clienteConfigurado();
    const orden = await obtenerOrdenDelUsuario(usuarioId, ordenId);

    if (orden.estado !== "Pendiente") {
      throw new HttpError(409, "La orden ya no está pendiente de pago");
    }

    const frontendUrl = obtenerFrontendUrl();
    const body = {
      items: orden.items.map((item) => ({
        id: String(item.id_producto),
        title: item.nombre,
        quantity: Number(item.cantidad),
        unit_price: Number(item.precio_unitario),
        currency_id: MONEDA,
      })),
      external_reference: String(orden.id),
      // Todas las respuestas vuelven a la página principal; el front muestra el resultado.
      back_urls: {
        success: `${frontendUrl}/?pago=exito`,
        failure: `${frontendUrl}/?pago=fallido`,
        pending: `${frontendUrl}/?pago=pendiente`,
      },
    };

    if (!esUrlLocal(frontendUrl)) {
      body.auto_return = "approved";
    }

    const backendPublicUrl = obtenerBackendPublicUrl();
    if (backendPublicUrl) {
      body.notification_url = `${backendPublicUrl}/api/v1/pagos/webhook`;
    }

    const preferencia = await new Preference(cliente).create({ body });
    return { init_point: preferencia.init_point };
  },

  // Confirmación desde el front al volver de Mercado Pago (útil en local, donde el webhook no llega).
  async confirmarPago(usuarioId, paymentId) {
    const { pago, ordenId } = await consultarPago(paymentId);
    const orden = await obtenerOrdenDelUsuario(usuarioId, ordenId);
    const { orden: ordenActualizada, reembolsado } = await aplicarPago(pago, orden);
    return { estadoPago: pago.status, orden: ordenActualizada, reembolsado };
  },

  // Al cancelar una orden pagada se devuelven sus pagos aprobados. Usa la misma clave de
  // idempotencia que el webhook, así un pago nunca se reembolsa dos veces.
  async reembolsarPagosAprobadosDeOrden(ordenId) {
    const cliente = obtenerClienteMercadoPago();
    if (!cliente) return []; // sin Mercado Pago solo hay pagos en efectivo o transferencia

    const busqueda = await new Payment(cliente).search({
      options: { external_reference: String(ordenId), status: "approved" },
    });
    const aprobados = (busqueda.results || []).filter(
      (pago) => pago.status === "approved" && pago.external_reference === String(ordenId),
    );

    for (const pago of aprobados) {
      await reembolsarPagoDeOrdenCancelada(pago, { id: ordenId });
    }
    return aprobados.map((pago) => pago.id);
  },

  // Conciliación activa: busca en Mercado Pago los pagos de la orden por external_reference y aplica
  // el primero aprobado. Es la red de seguridad cuando no llegan ni el webhook ni el retorno al sitio.
  // `ordenConocida` evita releer la orden cuando el llamador ya la tiene (por ejemplo, del listado).
  async sincronizarOrden(ordenId, ordenConocida) {
    const orden = tieneLoNecesarioParaAplicarPago(ordenConocida)
      ? ordenConocida
      : await ordenModel.obtenerOrdenConDetalle(ordenId);
    if (!orden) throw new HttpError(404, "La orden especificada no existe");

    const cliente = obtenerClienteMercadoPago();
    // Sin Mercado Pago (o sin nada que conciliar) la orden queda como está: no es un error.
    if (!cliente || orden.estado !== "Pendiente") return { orden, reembolsado: false };

    const busqueda = await new Payment(cliente).search({
      options: { external_reference: String(ordenId) },
    });
    const aprobado = (busqueda.results || []).find(
      (pago) => pago.status === "approved" && pago.external_reference === String(ordenId),
    );
    if (!aprobado) return { orden, reembolsado: false };

    return aplicarPago(aprobado, orden);
  },

  async sincronizarOrdenDelUsuario(usuarioId, ordenId) {
    await obtenerOrdenDelUsuario(usuarioId, ordenId);
    return this.sincronizarOrden(ordenId);
  },

  // Sincroniza las órdenes pendientes del usuario que pueden tener un pago en Mercado Pago:
  // recientes (DIAS_CONCILIACION) y con método de pasarela. Concilia en paralelo (CONCURRENCIA_CONCILIACION)
  // y, si una falla, registra el error y devuelve esa orden tal cual. El orden del listado se mantiene.
  async sincronizarPendientesDelUsuario(usuarioId) {
    const ordenes = await ordenModel.obtenerOrdenesPorUsuario(usuarioId);
    const pagadas = [];

    const conciliadas = await mapearConConcurrencia(ordenes, CONCURRENCIA_CONCILIACION, async (orden) => {
      if (!debeConciliarse(orden)) return orden;
      try {
        const { orden: actualizada } = await this.sincronizarOrden(orden.id, orden);
        if (actualizada.estado === "Pagado") pagadas.push(orden.id);
        return { ...orden, ...actualizada };
      } catch (error) {
        console.error(`No se pudo sincronizar la orden #${orden.id}:`, error);
        return orden;
      }
    });
    return { ordenes: conciliadas, pagadas: ordenes.map((o) => o.id).filter((id) => pagadas.includes(id)) };
  },

  async procesarNotificacion(paymentId) {
    const { pago, ordenId } = await consultarPago(paymentId);
    // Pagos ajenos a la tienda (sin external_reference) se ignoran sin reintentos
    if (!esIdValido(ordenId)) return null;
    const orden = await ordenModel.obtenerOrdenConDetalle(ordenId);
    if (!orden) return null;
    return (await aplicarPago(pago, orden)).orden;
  },
};

module.exports = pagoService;
