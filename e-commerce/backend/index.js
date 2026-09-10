// index.js (Raíz del proyecto)
// Carga siempre el archivo .env
require('dotenv').config();

// Importamos la aplicación de Express ya configurada
const app = require('./src/app.js');

// Asigna el puerto de las variables de entorno o usa el 3000 localmente
const PORT = process.env.PORT || 3000;

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});