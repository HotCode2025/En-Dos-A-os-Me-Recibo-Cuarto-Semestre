const express = require("express");
const router = express.Router();

const inventarioController = require("../controllers/InventarioController");
const { verificarToken } = require("../middlewares/autenticacionMiddleware");
const { permitRoles } = require("../middlewares/roleMiddleware");

// Consultar todos los productos y su stock
router.get("/", inventarioController.getAll);

// Consultar el stock de un producto por su ID
router.get("/:id", inventarioController.getById);

// Actualizar el stock: solo administradores
router.put(
  "/:id/stock",
  verificarToken,
  permitRoles("ADMIN"),
  inventarioController.updateStock
);

module.exports = router;
