const pool = require("../config/db");

const inventarioModel = {
  async getAll() {
    const query = `
      SELECT
        p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen_url,
        p.id_marca, m.nombre AS marca, p.id_categoria, c.nombre AS categoria
      FROM producto p
      JOIN marca m ON m.id = p.id_marca
      JOIN categorias c ON c.id = p.id_categoria
      ORDER BY p.nombre ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT id, nombre, stock FROM producto WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  },

  async updateStock(id, cantidad) {
    const result = await pool.query(
      "UPDATE producto SET stock = $1 WHERE id = $2 RETURNING id, nombre, stock",
      [cantidad, id]
    );
    return result.rows[0] || null;
  }
};

module.exports = inventarioModel;
