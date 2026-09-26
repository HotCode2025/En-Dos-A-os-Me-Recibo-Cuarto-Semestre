const pool = require("./db");

const cargarUsuario = async () => {
  // Insertamos al usuario con una contraseña en texto plano asumiendo
  // que tu login actual la compara directamente o la hasheamos después.
  const querySql = `
    INSERT INTO usuarios (nombre, email, password, rol) 
    VALUES ('Admin Test', 'testadmin@gmail.com', '12345', 'ADMIN')
    RETURNING id, email;
  `;

  try {
    const result = await pool.query(querySql);
    console.log("¡Usuario de prueba creado con éxito!");
    console.table(result.rows);
  } catch (error) {
    console.error("Error al cargar el usuario:", error.message);
  } finally {
    pool.end();
  }
};

cargarUsuario();
