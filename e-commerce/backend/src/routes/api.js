// src/routes/index.js (o api.js)
const express = require("express");
const router = express.Router();

// Importaciones actuales
const usuarioRoute = require("./UsuarioRoute");
const authRoute = require("./authRoute");
const productoRoute = require("./productoRoute");
const inventarioRoute = require("./inventarioRoute");
const pagoRoute = require("./pagoRoute");
const carritoRoute = require("./carritoRoute");
const ordenRoute = require("./ordenRoute");
const metodoPagoRoute = require("./metodoPagoRoute");

const autenticacionMiddleware = require("../middlewares/autenticacionMiddleware");

// RUTAS PÚBLICAS
router.use("/auth", authRoute);
router.use("/productos", productoRoute);
router.use("/inventario", inventarioRoute);

// RUTAS PRIVADAS
router.use("/usuarios", autenticacionMiddleware.verificarToken, usuarioRoute);
router.use("/carrito", carritoRoute);
router.use("/ordenes", ordenRoute);
router.use("/metodos-pago", metodoPagoRoute);
// Pagos: cada ruta declara su propia protección (el webhook es público y valida la firma)
router.use("/pagos", pagoRoute);

module.exports = router;
