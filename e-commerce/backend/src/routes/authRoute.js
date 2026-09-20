const express = require('express');
const router = express.Router();
const validarUsuario = require('../middlewares/validarUsuario');
const authController = require('../controllers/authController')
//ruta para añadir un usuario
router.post('/register', validarUsuario.nuevoUsuario ,authController.resgistrarUsuario);

module.exports = router; 