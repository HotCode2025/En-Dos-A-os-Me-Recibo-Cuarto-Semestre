const pool = require("../config/db");

const carritoModel = {
  obtenerCarritoPorUsuario: async (idUsuario) => {
    let queryCarrito = "SELECT id FROM carrito WHERE id_usuario = $1";
    let resultCarrito = await pool.query(queryCarrito, [idUsuario]);

    if (resultCarrito.rows.length === 0) {
      const insertCarrito =
        "INSERT INTO carrito (id_usuario) VALUES ($1) RETURNING id";
      resultCarrito = await pool.query(insertCarrito, [idUsuario]);
    }

    return resultCarrito.rows[0].id;
  },

  obtenerItemsCarrito: async (carritoId) => {
    const queryItems = `
      SELECT ic.id, ic.id_producto as producto_id, p.nombre, ic.cantidad, p.precio as precio_unitario, 
             (ic.cantidad * p.precio) as subtotal
      FROM item_carrito ic
      JOIN producto p ON ic.id_producto = p.id
      WHERE ic.id_carrito = $1
    `;
    const result = await pool.query(queryItems, [carritoId]);
    return result.rows;
  },

  obtenerProductoPorId: async (productoId) => {
    const query = "SELECT id, precio, stock FROM producto WHERE id = $1";
    const result = await pool.query(query, [productoId]);
    return result.rows[0];
  },

  buscarItemEnCarrito: async (carritoId, productoId) => {
    const query =
      "SELECT id, cantidad FROM item_carrito WHERE id_carrito = $1 AND id_producto = $2";
    const result = await pool.query(query, [carritoId, productoId]);
    return result.rows[0];
  },

  actualizarCantidadItem: async (itemId, nuevaCantidad) => {
    const query =
      "UPDATE item_carrito SET cantidad = $1 WHERE id = $2 RETURNING *";
    const result = await pool.query(query, [nuevaCantidad, itemId]);
    return result.rows[0];
  },

  agregarItemNuevo: async (carritoId, productoId, cantidad) => {
    const query = `
      INSERT INTO item_carrito (id_carrito, id_producto, cantidad) 
      VALUES ($1, $2, $3) RETURNING *
    `;
    const result = await pool.query(query, [carritoId, productoId, cantidad]);
    return result.rows[0];
  },
};

module.exports = carritoModel;
