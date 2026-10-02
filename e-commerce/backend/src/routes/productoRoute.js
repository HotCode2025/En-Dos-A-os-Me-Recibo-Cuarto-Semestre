const express = require("express");
const router = express.Router();
const productoController = require("../controllers/ProductoController");
const { verificarToken } = require("../middlewares/autenticacionMiddleware");
const { permitRoles } = require("../middlewares/roleMiddleware");

router.get("/", productoController.getAll);
router.get("/opciones", verificarToken, permitRoles("ADMIN"), productoController.getOptions);
router.post("/", verificarToken, permitRoles("ADMIN"), productoController.create);
router.put("/:id", verificarToken, permitRoles("ADMIN"), productoController.update);
router.delete("/:id", verificarToken, permitRoles("ADMIN"), productoController.delete);

module.exports = router;
