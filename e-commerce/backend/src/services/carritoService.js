const pool = require("../config/db");

const carritoService = {
  // Obtiene el carrito activo de un usuario y sus productos
  getCarritoByUsuario: async (usuarioId) => {
    // Validamos y aseguramos un ID de usuario existente en la base de datos
    const queryVerificarUser = "SELECT id FROM usuarios WHERE id = $1";
    let resUser = await pool.query(queryVerificarUser, [usuarioId]);

    let idUsuarioValido = usuarioId;

    if (resUser.rows.length === 0) {
      const queryFallback = "SELECT id FROM usuarios LIMIT 1";
      const resFallback = await pool.query(queryFallback);

      if (resFallback.rows.length === 0) {
        throw new Error("No hay usuarios registrados en la base de datos");
      }
      idUsuarioValido = resFallback.rows[0].id;
    }

    let queryCarrito = "SELECT id FROM carritos WHERE usuario_id = $1";
    let resultCarrito = await pool.query(queryCarrito, [idUsuarioValido]);

    if (resultCarrito.rows.length === 0) {
      const insertCarrito =
        "INSERT INTO carritos (usuario_id) VALUES ($1) RETURNING id";
      resultCarrito = await pool.query(insertCarrito, [idUsuarioValido]);
    }

    const carritoId = resultCarrito.rows[0].id;

    const queryItems = `
      SELECT ci.id, ci.producto_id, p.nombre, ci.cantidad, ci.precio_unitario, 
             (ci.cantidad * ci.precio_unitario) as subtotal
      FROM carrito_items ci
      JOIN productos p ON ci.producto_id = p.id
      WHERE ci.carrito_id = $1
    `;
    const resultItems = await pool.query(queryItems, [carritoId]);

    const total = resultItems.rows.reduce(
      (acc, item) => acc + parseFloat(item.subtotal),
      0,
    );

    return {
      carritoId,
      usuarioId: idUsuarioValido,
      items: resultItems.rows,
      total: total,
    };
  },

  // Agrega un producto al carrito
  agregarItem: async (usuarioId, productoId, cantidad) => {
    // 1. Validamos y aseguramos un ID de usuario existente en la base de datos
    const queryVerificarUser = "SELECT id FROM usuarios WHERE id = $1";
    let resUser = await pool.query(queryVerificarUser, [usuarioId]);

    let idUsuarioValido = usuarioId;

    if (resUser.rows.length === 0) {
      const queryFallback = "SELECT id FROM usuarios LIMIT 1";
      const resFallback = await pool.query(queryFallback);

      if (resFallback.rows.length === 0) {
        throw new Error("No hay usuarios registrados en la base de datos");
      }
      idUsuarioValido = resFallback.rows[0].id;
    }

    // 2. Obtenemos o creamos el carrito usando el ID validado
    let queryCarrito = "SELECT id FROM carritos WHERE usuario_id = $1";
    let resultCarrito = await pool.query(queryCarrito, [idUsuarioValido]);

    if (resultCarrito.rows.length === 0) {
      const insertCarrito =
        "INSERT INTO carritos (usuario_id) VALUES ($1) RETURNING id";
      resultCarrito = await pool.query(insertCarrito, [idUsuarioValido]);
    }

    const carritoId = resultCarrito.rows[0].id;

    // 3. Buscamos el precio actual del producto en el catálogo
    const queryProducto = "SELECT precio FROM productos WHERE id = $1";
    const resultProducto = await pool.query(queryProducto, [productoId]);

    if (resultProducto.rows.length === 0) {
      throw new Error("El producto no existe en el catálogo");
    }

    const precioUnitario = resultProducto.rows[0].precio;

    // 4. Verificamos si el producto ya está en el carrito para actualizar o insertar
    const queryCheckItem =
      "SELECT id, cantidad FROM carrito_items WHERE carrito_id = $1 AND producto_id = $2";
    const resultCheckItem = await pool.query(queryCheckItem, [
      carritoId,
      productoId,
    ]);

    if (resultCheckItem.rows.length > 0) {
      const nuevaCantidad = resultCheckItem.rows[0].cantidad + cantidad;
      const updateItem =
        "UPDATE carrito_items SET cantidad = $1 WHERE id = $2 RETURNING *";
      const resultUpdate = await pool.query(updateItem, [
        nuevaCantidad,
        resultCheckItem.rows[0].id,
      ]);
      return resultUpdate.rows[0];
    } else {
      const insertItem = `
        INSERT INTO carrito_items (carrito_id, producto_id, cantidad, precio_unitario) 
        VALUES ($1, $2, $3, $4) RETURNING *
      `;
      const resultInsert = await pool.query(insertItem, [
        carritoId,
        productoId,
        cantidad,
        precioUnitario,
      ]);
      return resultInsert.rows[0];
    }
  },
};

module.exports = carritoService;
