const { Pool } = require('pg');

// Neon requiere SSL activado para conexiones remotas seguras
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Probar la conexión
pool.connect()
  .then(() => console.log('¡Conectado exitosamente a la base de datos de Neon!'))
  .catch(err => console.error('Error de conexión a la base de datos:', err));

module.exports = pool;