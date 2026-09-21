const express = require('express');
const router = express.Router();
const validarUsuario = require('../middlewares/validarUsuario');
const authController = require('../controllers/authController')


//ruta para añadir un usuario
router.post('/register', validarUsuario.nuevoUsuario ,authController.resgistrarUsuario);

//ruta para login de un usuario.
router.post('/login', validarUsuario.login , authController.loginUsuario);

module.exports = router;