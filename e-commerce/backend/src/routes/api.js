// src/routes/index.js
const express = require('express');
const router = express.Router();

// 1. Importar los archivos de rutas individuales
const usuarioRoute = require('./UsuarioRoute');


// 2. Definir los prefijos para cada grupo de rutas
router.use('/usuarios', usuarioRoute);


module.exports = router;