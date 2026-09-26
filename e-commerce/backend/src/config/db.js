const { Pool } = require("pg");
require("dotenv").config();

// Verificamos si la URL de la base de datos apunta a tu PC local
const isLocal = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.includes("localhost")
  : true;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Si es local apagamos el SSL, si es Neon (nube) lo encendemos.
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on("connect", () => {
  // console.log('Conexión a la base de datos establecida.');
});

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de la base de datos", err);
  process.exit(-1);
});

module.exports = pool;
