// index.js (Raíz del proyecto)
// Carga siempre el archivo .env
require('dotenv').config();

// Cortamos el arranque si falta configuración obligatoria (por ejemplo JWT_SECRET)
const { validarEntorno } = require('./src/config/env');
try {
  validarEntorno();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Importamos la aplicación de Express ya configurada
const app = require('./src/app.js');

// Asigna el puerto de las variables de entorno o usa el 3001 localmente
const PORT = process.env.PORT || 3001;

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});