const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/UsuarioController');


//ruta para traer todos los usuarios, a esta ruta sólo pueden acceder los usuarios "ADMIN"
router.get('/', usuarioController.getAllUsuarios);


module.exports = router; 