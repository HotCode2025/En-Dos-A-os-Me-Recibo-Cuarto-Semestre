const express = require('express');
const app = express();

// Asigna el puerto de las variables de entorno o usa el 3000 localmente
const PORT = process.env.PORT || 3000;

// Ruta principal de prueba
app.get('/', (req, res) => {
  res.send('¡Servidor de Node y Express funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});