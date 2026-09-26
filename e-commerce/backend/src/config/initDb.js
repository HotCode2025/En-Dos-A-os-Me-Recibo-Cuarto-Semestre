const pool = require("./db");

const crearTablas = async () => {
  const querySql = `
    -- 1. Tabla de Usuarios (Debe existir primero)
    CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'cliente',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Tabla de Productos (Debe existir primero, manejando montos en ARS)
    CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Tabla principal del carrito (1 por usuario)
    CREATE TABLE IF NOT EXISTS carritos (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Tabla de los productos dentro de cada carrito
    CREATE TABLE IF NOT EXISTS carrito_items (
        id SERIAL PRIMARY KEY,
        carrito_id INT NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
        producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        cantidad INT NOT NULL DEFAULT 1,
        precio_unitario DECIMAL(10, 2) NOT NULL,
        agregado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log("Conectando a Neon para crear tablas base e intermedias...");
    await pool.query(querySql);
    console.log("¡Todas las tablas fueron creadas con éxito!");
  } catch (error) {
    console.error("Error al crear las tablas:", error);
  } finally {
    pool.end();
  }
};

crearTablas();
