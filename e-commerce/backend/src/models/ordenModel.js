const pool = require("../config/db");
const HttpError = require("../utils/httpError");

// Ejecuta fn dentro de una transacción y libera el cliente siempre.
async function enTransaccion(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Descuenta el stock de una orden que acaba de pagarse. El pago ya se cobró, así que si otra
// compra se llevó las unidades no se rechaza: el stock queda en 0 y se avisa para revisarlo.
async function descontarStockDeOrden(client, ordenId) {
  const detalle = await client.query(
    `
    SELECT p.id, p.nombre, p.stock, d.cantidad
    FROM detalle_orden d
    JOIN producto p ON p.id = d.id_producto
    WHERE d.id_orden = $1
    ORDER BY p.id
    FOR UPDATE OF p
  `,
    [ordenId],
  );

  const sinStock = detalle.rows.filter((item) => Number(item.cantidad) > Number(item.stock));
  if (sinStock.length) {
    console.warn(
      `Orden #${ordenId} pagada sin stock suficiente: ${sinStock
        .map((item) => `${item.nombre} (pedido ${item.cantidad}, disponible ${item.stock})`)
        .join(", ")}`,
    );
  }

  await client.query(
    `
    UPDATE producto p
    SET stock = GREATEST(p.stock - d.cantidad, 0)
    FROM detalle_orden d
    WHERE d.id_orden = $1 AND p.id = d.id_producto
  `,
    [ordenId],
  );
}

// Las órdenes pagadas antes de STOCK_AL_PAGAR_DESDE nunca descontaron stock, así que no se repone.
// La base no guarda la fecha de pago, por eso se compara con fecha_pedido.
function descontoStockAlPagar(fechaPedido) {
  const corte = process.env.STOCK_AL_PAGAR_DESDE;
  if (!corte) return true;
  return new Date(fechaPedido).getTime() >= new Date(corte).getTime();
}

const ordenModel = {
  crearOrdenTransaccional: async (usuarioId, metodoPagoId) => {
    return enTransaccion(async (client) => {
      const carritoRes = await client.query(
        "SELECT id FROM carrito WHERE id_usuario = $1",
        [usuarioId],
      );
      const carritoId = carritoRes.rows[0]?.id;

      // 1. Leer los ítems bloqueando los productos para que nadie más descuente su stock en paralelo
      const items = carritoId
        ? (
            await client.query(
              `
              SELECT ic.id_producto AS producto_id, p.nombre, ic.cantidad,
                     p.precio AS precio_unitario, p.stock
              FROM item_carrito ic
              JOIN producto p ON p.id = ic.id_producto
              WHERE ic.id_carrito = $1
              ORDER BY p.id
              FOR UPDATE OF p
            `,
              [carritoId],
            )
          ).rows
        : [];

      if (items.length === 0) {
        throw new HttpError(400, "El carrito está vacío. No se puede generar una orden.");
      }

      // 2. Validar stock con los valores bloqueados
      const sinStock = items.find((item) => item.cantidad > item.stock);
      if (sinStock) {
        throw new HttpError(
          409,
          `No hay stock suficiente de ${sinStock.nombre}. Disponible: ${sinStock.stock}`,
        );
      }

      // Total en centavos para evitar errores de punto flotante
      const totalCentavos = items.reduce(
        (acc, item) => acc + Math.round(Number(item.precio_unitario) * 100) * item.cantidad,
        0,
      );
      const total = (totalCentavos / 100).toFixed(2);

      // 3. Insertar la orden principal
      const resultOrden = await client.query(
        `
        INSERT INTO orden (id_usuario, id_metodo_pago, estado, total, fecha_pedido)
        VALUES ($1, $2, 'Pendiente', $3, NOW())
        RETURNING *
      `,
        [usuarioId, metodoPagoId, total],
      );
      const nuevaOrden = resultOrden.rows[0];

      // 4. Insertar los ítems en detalle_orden (el stock se descuenta recién al pagar)
      for (const item of items) {
        await client.query(
          `
          INSERT INTO detalle_orden (id_orden, id_producto, cantidad, precio_unitario)
          VALUES ($1, $2, $3, $4)
        `,
          [nuevaOrden.id, item.producto_id, item.cantidad, item.precio_unitario],
        );
      }

      // 5. Vaciar el carrito del usuario tras confirmar la compra
      await client.query("DELETE FROM item_carrito WHERE id_carrito = $1", [carritoId]);

      return { orden: nuevaOrden, items };
    });
  },

  obtenerOrdenConDetalle: async (ordenId) => {
    const resultOrden = await pool.query("SELECT * FROM orden WHERE id = $1", [ordenId]);
    const orden = resultOrden.rows[0];
    if (!orden) return null;

    const resultItems = await pool.query(
      `
      SELECT d.id_producto, p.nombre, d.cantidad, d.precio_unitario
      FROM detalle_orden d
      JOIN producto p ON p.id = d.id_producto
      WHERE d.id_orden = $1
      ORDER BY d.id_producto
    `,
      [ordenId],
    );
    return { ...orden, items: resultItems.rows };
  },

  // Solo pasa a Pagado una orden Pendiente: repetir la notificación no tiene efecto.
  marcarComoPagada: async (ordenId) => {
    return enTransaccion(async (client) => {
      const result = await client.query(
        "UPDATE orden SET estado = 'Pagado' WHERE id = $1 AND estado = 'Pendiente' RETURNING *",
        [ordenId],
      );
      const orden = result.rows[0];
      if (!orden) return null;

      await descontarStockDeOrden(client, ordenId);
      return orden;
    });
  },

  obtenerOrdenesPorUsuario: async (usuarioId) => {
    const query = `
     SELECT
        o.*,
        m.nombre AS metodo_pago_nombre
      FROM orden o
      LEFT JOIN metodo_pago m
        ON o.id_metodo_pago = m.id
      WHERE o.id_usuario = $1
      ORDER BY o.fecha_pedido DESC;`;
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

  actualizarEstadoOrden: async (ordenId, nuevoEstado, esTransicionValida) => {
    return enTransaccion(async (client) => {
      const actual = await client.query(
        "SELECT estado, fecha_pedido FROM orden WHERE id = $1 FOR UPDATE",
        [ordenId],
      );
      if (actual.rows.length === 0) {
        throw new HttpError(404, "La orden especificada no existe");
      }

      const estadoActual = actual.rows[0].estado;
      if (!esTransicionValida(estadoActual, nuevoEstado)) {
        throw new HttpError(409, `No se puede pasar una orden de ${estadoActual} a ${nuevoEstado}`);
      }

      // El stock se descuenta al pagar, así que solo se repone al cancelar una orden ya pagada
      if (nuevoEstado === "Pagado") {
        await descontarStockDeOrden(client, ordenId);
      }
      if (
        nuevoEstado === "Cancelado" &&
        estadoActual === "Pagado" &&
        descontoStockAlPagar(actual.rows[0].fecha_pedido)
      ) {
        // Mismo orden de bloqueo que descontarStockDeOrden para evitar deadlocks
        await client.query(
          `
          SELECT p.id FROM detalle_orden d
          JOIN producto p ON p.id = d.id_producto
          WHERE d.id_orden = $1
          ORDER BY p.id
          FOR UPDATE OF p
        `,
          [ordenId],
        );
        await client.query(
          `
          UPDATE producto p
          SET stock = p.stock + d.cantidad
          FROM detalle_orden d
          WHERE d.id_orden = $1 AND p.id = d.id_producto
        `,
          [ordenId],
        );
      }

      const result = await client.query(
        "UPDATE orden SET estado = $1 WHERE id = $2 RETURNING *",
        [nuevoEstado, ordenId],
      );
      return { orden: result.rows[0], estadoAnterior: estadoActual };
    });
  },
};

module.exports = ordenModel;
