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

// Neon corta las conexiones inactivas: el error se registra, pero el servidor sigue en pie
// (el pool descarta el cliente roto y abre otro en la próxima consulta).
function manejarErrorDelPool(err) {
  console.error("Error inesperado en el pool de la base de datos", err);
}

pool.on("error", manejarErrorDelPool);
pool.manejarErrorDelPool = manejarErrorDelPool;

module.exports = pool;
