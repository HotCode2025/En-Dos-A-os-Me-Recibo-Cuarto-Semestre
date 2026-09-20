const express = require('express');
const router = express.Router();
const validarUsuario= require('../middlewares/validarUsuario');

const usuarioController = require('../controllers/UsuarioController');

//ruta para traer todos los usuarios
router.get('/', usuarioController.getAllUsuarios);
//ruta para añadir un usuario
router.post('/', validarUsuario.nuevoUsuario ,usuarioController.postUsuario);


module.exports = router;