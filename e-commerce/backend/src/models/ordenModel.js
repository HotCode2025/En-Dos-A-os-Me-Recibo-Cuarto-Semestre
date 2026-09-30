const pool = require("../config/db");

const ordenModel = {
  crearOrdenTransaccional: async (
    usuarioId,
    direccionId,
    metodoPagoId,
    itemsCarrito,
    total,
  ) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insertar la orden principal
      const queryOrden = `
        INSERT INTO orden (id_usuario, id_direccion_envio, id_metodo_pago, estado, total, fecha_pedido)
        VALUES ($1, $2, $3, 'Pendiente', $4, NOW())
        RETURNING *
      `;
      const resultOrden = await client.query(queryOrden, [
        usuarioId,
        direccionId,
        metodoPagoId,
        total,
      ]);
      const nuevaOrden = resultOrden.rows[0];

      // 2. Insertar los ítems en detalle_orden
      for (const item of itemsCarrito) {
        const queryDetalle = `
          INSERT INTO detalle_orden (id_orden, id_producto, cantidad, precio_unitario)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(queryDetalle, [
          nuevaOrden.id,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
        ]);
      }

      // 3. Vaciar el carrito del usuario tras confirmar la compra
      const carritoRes = await client.query(
        "SELECT id FROM carrito WHERE id_usuario = $1",
        [usuarioId],
      );
      if (carritoRes.rows.length > 0) {
        const carritoId = carritoRes.rows[0].id;
        await client.query("DELETE FROM item_carrito WHERE id_carrito = $1", [
          carritoId,
        ]);
      }

      await client.query("COMMIT");
      return nuevaOrden;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  obtenerOrdenesPorUsuario: async (usuarioId) => {
    const query = `
      SELECT o.*, m.nombre as metodo_pago_nombre, d.calle_numero, d.ciudad 
      FROM orden o
      LEFT JOIN metodo_pago m ON o.id_metodo_pago = m.id
      LEFT JOIN direccion d ON o.id_direccion_envio = d.id
      WHERE o.id_usuario = $1
      ORDER BY o.fecha_pedido DESC
    `;
    const result = await pool.query(query, [usuarioId]);
    return result.rows;
  },

  obtenerTodasLasOrdenes: async () => {
    const query = `
      SELECT o.*, u.nombre as usuario_nombre, u.email as usuario_email, m.nombre as metodo_pago_nombre
      FROM orden o
      JOIN usuario u ON o.id_usuario = u.id
      LEFT JOIN metodo_pago m ON o.id_metodo_pago = m.id
      ORDER BY o.fecha_pedido DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  actualizarEstadoOrden: async (ordenId, nuevoEstado) => {
    const query = `
      UPDATE orden 
      SET estado = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [nuevoEstado, ordenId]);
    return result.rows[0];
  },
};

module.exports = ordenModel;
