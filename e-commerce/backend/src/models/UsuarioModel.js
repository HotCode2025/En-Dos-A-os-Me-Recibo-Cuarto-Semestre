const pool = require('../config/db');

const Usuario = {
  async getAllUsuarios() {
    const result = await pool.query('SELECT * FROM usuario');
    return result.rows;
  },

 //método para añadir un nuevo usuario 
  async postUsuario(datosUsuario) {
    const { nombre } = datosUsuario; // Ajusta los campos según tu tabla
    
    return nombre; 

    /*
    const query = `
      INSERT INTO usuario (nombre, email, password) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const values = [nombre, email, password];
    const result = await pool.query(query, values);
    return result.rows[0]; // Retorna el usuario recién creado
    */
  }

};

module.exports = Usuario;