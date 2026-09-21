// src/routes/index.js
const express = require('express');
const router = express.Router();

// Importación de los archivos de rutas individuales
const usuarioRoute = require('./UsuarioRoute');
const authRoute = require('./authRoute');

//importamos el middlewares para proteger la ruta, es decir, solo se puede acceder a la misma si la petición tiene un token válido

const autenticacionMiddleware = require('../middlewares/autenticacionMiddleware');

//RUTAS PÚBLICAS
router.use('/auth', authRoute);

//RUTAS PRIVADAS: sólo se puede acceder si el usuario esta logueado. 

// se define los prefijos para cada grupo de rutas
router.use('/usuarios', autenticacionMiddleware.verificarToken, usuarioRoute);


module.exports = router;