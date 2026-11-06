const express = require("express");
const router = express.Router();
const pagoController = require("../controllers/pagoController");
const { verificarToken } = require("../middlewares/autenticacionMiddleware");

// Genera el link de pago de una orden propia y pendiente
router.post("/crear-preferencia", verificarToken, pagoController.crearPreferencia);

// El front confirma el pago al volver de Mercado Pago
router.post("/confirmar", verificarToken, pagoController.confirmarPago);

// Conciliación activa con Mercado Pago. /sincronizar-pendientes va antes de /sincronizar/:ordenId.
router.post("/sincronizar-pendientes", verificarToken, pagoController.sincronizarPendientes);
router.post("/sincronizar/:ordenId", verificarToken, pagoController.sincronizarOrden);

// Notificaciones de Mercado Pago (públicas; se validan con MP_WEBHOOK_SECRET)
router.post("/webhook", pagoController.webhook);

module.exports = router;
