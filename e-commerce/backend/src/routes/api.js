// src/routes/index.js
const express = require('express');
const router = express.Router();

// Importación de los archivos de rutas individuales
const usuarioRoute = require('./UsuarioRoute');
const authRoute = require('./authRoute')



//RUTAS PÚBLICAS
router.use('/auth', authRoute);

//RUTAS PRIVADAS: sólo se puede acceder si el usuario esta logueado. 

// se define los prefijos para cada grupo de rutas
router.use('/usuarios', usuarioRoute);


module.exports = router;