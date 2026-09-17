const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/UsuarioController');

//ruta para traer todos los usuarios
router.get('/', usuarioController.getAllUsuarios);
//ruta para añadir un usuario
router.post('/', usuarioController.postUsuario);


module.exports = router;