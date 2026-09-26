const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/UsuarioController');

//Se protegen las rutas por roles
const roleMiddleware = require('../middlewares/roleMiddleware')


// ==========================================
// RUTAS DEL PERFIL (Cualquier usuario autenticado)
// ==========================================
router.get('/perfil', usuarioController.getPerfil);
router.put('/perfil', usuarioController.modificarPerfil);

// ==========================================
// RUTAS DE LAS DIRECIONES DEL USUARIO (Cualquier usuario autenticado)
// ==========================================

// ==========================================
// RUTAS QUE SOLO SE ACCEDEN DESDE USUARIOS ADMIN
// ==========================================

router.get('/', roleMiddleware.permitRoles("ADMIN"), usuarioController.getAllUsuarios);


module.exports = router; 