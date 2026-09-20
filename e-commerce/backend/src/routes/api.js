// src/routes/index.js
const express = require('express');
const router = express.Router();

// Importación de los archivos de rutas individuales
const usuarioRoute = require('./UsuarioRoute');


// se defini los prefijos para cada grupo de rutas
router.use('/usuarios', usuarioRoute);


module.exports = router;