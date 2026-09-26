const express = require("express");
const router = express.Router();
// Importamos el controlador que tiene la lógica
const carritoController = require("../controllers/carritoController");
// Importamos el middleware que extrae y valida el JWT
const { verificarToken } = require("../middlewares/autenticacionMiddleware");

// RUTAS DEL CARRITO
// Todas estas rutas están protegidas por 'verificarToken'

// GET /api/carrito -> Obtiene el carrito del usuario logueado
router.get("/", verificarToken, carritoController.getMiCarrito);

// POST /api/carrito/agregar -> Suma un producto al carrito
router.post("/agregar", verificarToken, carritoController.agregarProducto);

module.exports = router;
