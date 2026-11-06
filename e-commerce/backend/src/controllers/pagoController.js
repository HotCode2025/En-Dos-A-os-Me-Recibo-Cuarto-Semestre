const { WebhookSignatureValidator } = require("mercadopago");
const pagoService = require("../services/pagoService");
const { parseId } = require("../utils/parseId");
const HttpError = require("../utils/httpError");

const esEnteroPositivo = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

// Solo un HttpError propio expone su status y mensaje; cualquier otro error (incluidos los
// MercadoPagoError del SDK, que traen `status`) responde 502 con un mensaje fijo. Así un 401 de
// Mercado Pago no se confunde con una sesión vencida en el front.
function responderErrorDePago(res, error, mensajeFijo) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(502).json({ error: mensajeFijo });
}

const pagoController = {
  async crearPreferencia(req, res) {
    // El total ya no se acepta del cliente: se calcula desde la orden guardada.
    const ordenId = Number(req.body?.ordenId);
    if (!esEnteroPositivo(ordenId)) {
      return res.status(400).json({ error: "El ordenId debe ser un entero positivo" });
    }

    try {
      const resultado = await pagoService.crearPreferencia(req.usuario.id, ordenId);
      return res.status(200).json(resultado);
    } catch (error) {
      console.error("Error en Mercado Pago:", error);
      return responderErrorDePago(res, error, "Error al generar link de pago");
    }
  },

  async confirmarPago(req, res) {
    const paymentId = String(req.body?.paymentId ?? "");
    if (!/^\d+$/.test(paymentId)) {
      return res.status(400).json({ error: "El paymentId no es válido" });
    }

    try {
      const resultado = await pagoService.confirmarPago(req.usuario.id, paymentId);
      return res.status(200).json(resultado);
    } catch (error) {
      console.error("Error al confirmar el pago:", error);
      return responderErrorDePago(res, error, "No se pudo verificar el pago con Mercado Pago");
    }
  },

  // Conciliación activa de una orden: el dueño sincroniza la suya y el ADMIN, cualquiera.
  async sincronizarOrden(req, res) {
    try {
      const ordenId = parseId(req.params?.ordenId, "El id de la orden no es válido");
      const resultado =
        req.usuario.rol === "ADMIN"
          ? await pagoService.sincronizarOrden(ordenId)
          : await pagoService.sincronizarOrdenDelUsuario(req.usuario.id, ordenId);
      return res.status(200).json(resultado);
    } catch (error) {
      console.error("Error al sincronizar el pago de la orden:", error);
      return responderErrorDePago(res, error, "No se pudo verificar el pago con Mercado Pago");
    }
  },

  async sincronizarPendientes(req, res) {
    try {
      const resultado = await pagoService.sincronizarPendientesDelUsuario(req.usuario.id);
      return res.status(200).json(resultado);
    } catch (error) {
      console.error("Error al sincronizar las órdenes pendientes:", error);
      return responderErrorDePago(res, error, "No se pudo verificar el pago con Mercado Pago");
    }
  },

  async webhook(req, res) {
    const tipo = req.query?.type || req.body?.type;
    const paymentId = req.query?.["data.id"] || req.body?.data?.id;

    const secreto = process.env.MP_WEBHOOK_SECRET;
    if (secreto) {
      try {
        WebhookSignatureValidator.validate({
          xSignature: req.headers["x-signature"],
          xRequestId: req.headers["x-request-id"],
          dataId: req.query?.["data.id"],
          secret: secreto,
        });
      } catch (error) {
        console.warn("Webhook de Mercado Pago con firma inválida:", error.message);
        return res.status(401).json({ error: "Firma inválida" });
      }
    }

    if (tipo !== "payment" || !paymentId) {
      return res.sendStatus(200);
    }

    try {
      await pagoService.procesarNotificacion(String(paymentId));
      return res.sendStatus(200);
    } catch (error) {
      // Un status distinto de 2xx hace que Mercado Pago reintente la notificación.
      console.error("Error al procesar el webhook de Mercado Pago:", error);
      return res.sendStatus(500);
    }
  },
};

module.exports = pagoController;
