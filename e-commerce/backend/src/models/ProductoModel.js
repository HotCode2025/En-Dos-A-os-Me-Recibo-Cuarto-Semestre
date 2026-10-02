const pool = require("../config/db");

const productoModel = {
  async getAll() {
    const query = `
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.puntuacion_promedio,
        p.es_destacado,
        p.id_marca,
        m.nombre AS marca,
        p.id_categoria,
        c.nombre AS categoria,
        p.fecha_creacion,
        p.stock,
        p.imagen_url,
        COUNT(v.id)::int AS cantidad_valoraciones
      FROM producto p
      JOIN marca m ON m.id = p.id_marca
      JOIN categorias c ON c.id = p.id_categoria
      LEFT JOIN valoracion v ON v.id_producto = p.id
      GROUP BY p.id, m.nombre, c.nombre
      ORDER BY p.es_destacado DESC, p.id
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getOptions() {
    const [brands, categories] = await Promise.all([
      pool.query("SELECT id, nombre FROM marca ORDER BY nombre"),
      pool.query("SELECT id, nombre FROM categorias ORDER BY nombre"),
    ]);
    return { marcas: brands.rows, categorias: categories.rows };
  },

  async create(product) {
    const query = `
      INSERT INTO producto
        (nombre, descripcion, precio, puntuacion_promedio, es_destacado, id_marca, id_categoria, stock, imagen_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await pool.query(query, [
      product.nombre,
      product.descripcion,
      product.precio,
      product.puntuacion_promedio,
      product.es_destacado,
      product.id_marca,
      product.id_categoria,
      product.stock,
      product.imagen_url,
    ]);
    return result.rows[0];
  },

  async update(id, product) {
    const columns = {
      nombre: "nombre",
      descripcion: "descripcion",
      precio: "precio",
      es_destacado: "es_destacado",
      id_marca: "id_marca",
      id_categoria: "id_categoria",
      stock: "stock",
      imagen_url: "imagen_url",
    };
    const fields = Object.entries(product).filter(([key]) => columns[key]);
    if (fields.length === 0) return null;

    const assignments = fields.map(
      ([key], index) => `${columns[key]} = $${index + 1}`,
    );
    const values = fields.map(([, value]) => value);
    values.push(id);
    const query = `
      UPDATE producto
      SET ${assignments.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await pool.query(
      "DELETE FROM producto WHERE id = $1 RETURNING id",
      [id],
    );
    return result.rows[0] || null;
  },
};

module.exports = productoModel;
