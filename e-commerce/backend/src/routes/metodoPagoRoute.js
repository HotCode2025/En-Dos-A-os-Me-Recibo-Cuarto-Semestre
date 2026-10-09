const express = require("express");
const router = express.Router();
const metodoPagoController = require("../controllers/metodoPagoController");
const { verificarToken } = require("../middlewares/autenticacionMiddleware");
const { permitRoles } = require("../middlewares/roleMiddleware");

// Rutas de lectura (Clientes y Administradores pueden ver los métodos de pago disponibles)[cite: 25]
router.get(
  "/",
  metodoPagoController.getMetodosPago,
);
router.get(
  "/:id",
  verificarToken,
  permitRoles("CLIENTE", "ADMIN"),
  metodoPagoController.getMetodoPagoById,
);

// Rutas de administración (Exclusivas para rol ADMIN)[cite: 25]
router.post(
  "/",
  verificarToken,
  permitRoles("ADMIN"),
  metodoPagoController.crearMetodoPago,
);
router.put(
  "/:id",
  verificarToken,
  permitRoles("ADMIN"),
  metodoPagoController.actualizarMetodoPago,
);
router.delete(
  "/:id",
  verificarToken,
  permitRoles("ADMIN"),
  metodoPagoController.eliminarMetodoPago,
);

module.exports = router;
