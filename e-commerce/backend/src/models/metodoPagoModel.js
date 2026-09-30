const pool = require("../config/db"); // Ajusta la ruta de tu conexión si es diferente

const metodoPagoModel = {
  async getAll() {
    const query = "SELECT * FROM metodo_pago ORDER BY id ASC";
    const result = await pool.query(query);
    return result.rows;
  },

  async getById(id) {
    const query = "SELECT * FROM metodo_pago WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async create({ nombre, descripcion, instrucciones, activo }) {
    const query = `
      INSERT INTO metodo_pago (nombre, descripcion, instrucciones, activo)
      VALUES ($1, $2, $3, COALESCE($4, true))
      RETURNING *
    `;
    const result = await pool.query(query, [
      nombre,
      descripcion,
      instrucciones,
      activo,
    ]);
    return result.rows[0];
  },

  async update(id, { nombre, descripcion, instrucciones, activo }) {
    const query = `
      UPDATE metodo_pago 
      SET nombre = COALESCE($1, nombre),
          descripcion = COALESCE($2, descripcion),
          instrucciones = COALESCE($3, instrucciones),
          activo = COALESCE($4, activo)
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [
      nombre,
      descripcion,
      instrucciones,
      activo,
      id,
    ]);
    return result.rows[0];
  },

  async delete(id) {
    const query = "DELETE FROM metodo_pago WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
};

module.exports = metodoPagoModel;
