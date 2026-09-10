const pool = require('../config/db');

const Usuario = {
  async getAllUsuarios() {
    const result = await pool.query('SELECT * FROM usuario');
    return result.rows;
  }
};

module.exports = Usuario;