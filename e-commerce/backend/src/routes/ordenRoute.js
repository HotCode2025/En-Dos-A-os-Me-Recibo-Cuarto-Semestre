const express = require("express");
const router = express.Router();
const ordenController = require("../controllers/ordenController");
const { verificarToken } = require("../middlewares/autenticacionMiddleware");
const { permitRoles } = require("../middlewares/roleMiddleware");

// Rutas protegidas con token y roles correctos
router.post(
  "/",
  verificarToken,
  permitRoles("CLIENTE", "ADMIN"),
  ordenController.crearOrden,
);
router.get(
  "/mis-ordenes",
  verificarToken,
  permitRoles("CLIENTE", "ADMIN"),
  ordenController.getMisOrdenes,
);
router.get(
  "/",
  verificarToken,
  permitRoles("ADMIN"),
  ordenController.getAllOrdenes,
);
// PUT /api/v1/ordenes/:id/estado -> Actualiza el estado de una orden
router.put(
  "/:id/estado",
  verificarToken,
  permitRoles("ADMIN"),
  ordenController.actualizarEstado,
);

module.exports = router;
