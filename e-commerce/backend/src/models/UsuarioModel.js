const pool = require('../config/db');

const Usuario = {
  async getAllUsuarios() {
    const result = await pool.query('SELECT * FROM usuario');
    return result.rows;
  },

 //método para añadir un nuevo usuario 
  async postUsuario(datosUsuario) {
    //1. Obtenermos los campos del usuario

    const { nombre, apellido, email, password, telefono, rol } = datosUsuario;
    
    //2. Preparamos la consulta
    const query = `
      INSERT INTO usuario (nombre, apellido, email, password_hash, telefono, rol) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, nombre, apellido, email, telefono, rol, fecha_registro
    `;
    
    //3. Pasamos los valores de la consulta
    const values = [nombre, apellido, email, password, telefono, rol];
    
    //4. Ejecutamos la consulta y nos devuelve el resultado
    const result = await pool.query(query, values);

    // Retorna el usuario recién creado
    return result.rows[0]; 
    
  }

};

module.exports = Usuario;