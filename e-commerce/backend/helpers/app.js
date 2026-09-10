// src/app.js
const express = require('express');
const app = express();

// Middlewares globales

//permitimos que la app reciba en las peticiones json
app.use(express.json());

// Importación de rutas principales
// const apiRouter = require('./routes/index'); // Asumiendo que agrupa tus rutas /api/v1

// Ruta principal de prueba
app.get('/', (req, res) => {
  res.send('¡Servidor de Node y Express funcionando!');
});

// Ruta de prueba de base de datos (puedes dejarla aquí o moverla a un controller/route)
const pool = require('../src/config/db');
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Conexión funcionando', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// Montar el enrutador principal en /api/v1 (o la ruta que prefieras)
// app.use('/api/v1', apiRouter);

// Exportamos la app configurada (sin levantar el servidor aún)
module.exports = app;