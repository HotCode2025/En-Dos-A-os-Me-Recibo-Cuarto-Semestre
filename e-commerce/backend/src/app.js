// src/app.js
const express = require('express');
const cors = require('cors'); // 
const express = require("express");
const cors = require("cors"); // 1. Importamos CORS
const { obtenerOrigenesPermitidos } = require("./config/cors");
const app = express();


// 2. Configurar para que solo acepte tu URL de Netlify
const corsOptions = {
  origin: 'https://puntozeroecommerce.netlify.app/', 
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // 3. Aplicar el middleware

// Middlewares globales
// 2. Configuramos CORS: localhost por defecto, o CORS_ORIGIN / FRONTEND_URL en producción
app.use(
  cors({
    origin: obtenerOrigenesPermitidos(),
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// permitimos que la app reciba en las peticiones json
app.use(express.json());

// Importación de rutas principales
const apiRouter = require("./routes/api");
const { errorHandler, noEncontrado } = require("./middlewares/errorHandler");

// Ruta principal de prueba
app.get("/", (req, res) => {
  res.send("¡Servidor de Node y Express funcionando!");
});

// Ruta de prueba de base de datos.
const pool = require("./config/db");
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Conexión funcionando", time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar la base de datos" });
  }
});

// Montar el enrutador principal en /api/v1
app.use("/api/v1", apiRouter);

// Al final: 404 en JSON y manejo central de errores (contrato { error })
app.use(noEncontrado);
app.use(errorHandler);

// Exportamos la app configurada
module.exports = app;
