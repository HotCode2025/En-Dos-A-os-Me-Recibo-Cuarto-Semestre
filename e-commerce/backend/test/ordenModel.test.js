const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar, crearClienteFalso } = require("./helpers");

const estado = {};

mockModule("./src/config/db", {
  async connect() {
    return estado.cliente;
  },
  async query() {
    return { rows: [] };
  },
});

const ordenModel = cargar("./src/models/ordenModel");

function itemsCarrito(stockMouse = 5) {
  return [
    { producto_id: 1, nombre: "Mouse", cantidad: 2, precio_unitario: "500.25", stock: stockMouse },
    { producto_id: 2, nombre: "Pad", cantidad: 1, precio_unitario: "0.10", stock: 1 },
  ];
}

function prepararCliente(items = []) {
  estado.cliente = crearClienteFalso((sql) => {
    if (sql.includes("FROM carrito")) return { rows: [{ id: 10 }] };
    if (sql.includes("FROM item_carrito")) return { rows: items };
    if (sql.includes("INSERT INTO orden")) return { rows: [{ id: 7, estado: "Pendiente" }] };
    if (sql.includes("SELECT estado")) return { rows: estado.ordenActual ? [estado.ordenActual] : [] };
    if (sql.includes("FROM detalle_orden d")) return { rows: estado.detalle };
    if (sql.includes("SET estado = 'Pagado'")) {
      return { rows: estado.ordenActual?.estado === "Pendiente" ? [{ id: 7, estado: "Pagado" }] : [] };
    }
    if (sql.includes("UPDATE orden SET estado = $1")) return { rows: [{ id: 7, estado: estado.nuevoEstado }] };
    return { rows: [] };
  });
}

const consultas = () => estado.cliente.consultas.map((c) => c.sql);
const descuentaStock = () => consultas().some((s) => s.includes("GREATEST(p.stock - d.cantidad, 0)"));
const reponeStock = () => consultas().some((s) => s.includes("SET stock = p.stock + d.cantidad"));

beforeEach(() => {
  estado.ordenActual = null;
  estado.nuevoEstado = undefined;
  estado.detalle = [
    { id: 1, nombre: "Mouse", stock: 5, cantidad: 2 },
    { id: 2, nombre: "Pad", stock: 1, cantidad: 1 },
  ];
});

test("crearOrdenTransaccional bloquea los productos con FOR UPDATE dentro de la transacción", async () => {
  prepararCliente(itemsCarrito());

  await ordenModel.crearOrdenTransaccional(3, 1);

  const sqls = consultas();
  assert.equal(sqls[0], "BEGIN");
  assert.match(sqls.find((s) => s.includes("FROM item_carrito")), /FOR UPDATE OF p/);
  assert.equal(sqls.at(-1), "COMMIT");
  assert.equal(estado.cliente.liberado, true);
});

test("crearOrdenTransaccional guarda el total exacto con las columnas reales de orden, sin descontar stock", async () => {
  prepararCliente(itemsCarrito());

  const { orden, items } = await ordenModel.crearOrdenTransaccional(3, 1);

  assert.equal(orden.id, 7);
  assert.equal(items.length, 2);
  const insertOrden = estado.cliente.consultas.find((c) => c.sql.includes("INSERT INTO orden"));
  assert.deepEqual(insertOrden.params, [3, 1, "1000.60"]);
  // Solo columnas que existen en la base real (la tabla orden no tiene id_direccion_envio)
  assert.match(insertOrden.sql, /INSERT INTO orden \(id_usuario, id_metodo_pago, estado, total, fecha_pedido\)/);
  assert.ok(!consultas().some((s) => s.startsWith("UPDATE producto")));
  assert.ok(consultas().some((s) => s.startsWith("DELETE FROM item_carrito")));
});

test("crearOrdenTransaccional hace ROLLBACK con 409 si no hay stock suficiente", async () => {
  prepararCliente(itemsCarrito(1));

  await assert.rejects(ordenModel.crearOrdenTransaccional(3, 1), {
    status: 409,
    message: "No hay stock suficiente de Mouse. Disponible: 1",
  });

  const sqls = consultas();
  assert.equal(sqls.at(-1), "ROLLBACK");
  assert.ok(!sqls.some((s) => s.includes("INSERT INTO orden")));
  assert.equal(estado.cliente.liberado, true);
});

test("crearOrdenTransaccional rechaza un carrito vacío con el mensaje existente", async () => {
  prepararCliente([]);

  await assert.rejects(ordenModel.crearOrdenTransaccional(3, 1), {
    status: 400,
    message: "El carrito está vacío. No se puede generar una orden.",
  });
  assert.equal(consultas().at(-1), "ROLLBACK");
});

test("marcarComoPagada descuenta el stock en la misma transacción", async () => {
  prepararCliente();
  estado.ordenActual = { estado: "Pendiente" };

  const orden = await ordenModel.marcarComoPagada(7);

  assert.equal(orden.estado, "Pagado");
  assert.ok(descuentaStock());
  assert.match(consultas().find((s) => s.includes("FROM detalle_orden d")), /FOR UPDATE OF p/);
  assert.equal(consultas().at(-1), "COMMIT");
});

test("marcarComoPagada no descuenta stock si la orden ya no estaba pendiente", async () => {
  prepararCliente();
  estado.ordenActual = { estado: "Pagado" };

  assert.equal(await ordenModel.marcarComoPagada(7), null);
  assert.ok(!descuentaStock());
});

test("marcarComoPagada deja el stock en 0 y avisa si se vendió de más", async (t) => {
  prepararCliente();
  estado.ordenActual = { estado: "Pendiente" };
  estado.detalle = [{ id: 1, nombre: "Mouse", stock: 1, cantidad: 2 }];
  const advertencia = t.mock.method(console, "warn", () => {});

  const orden = await ordenModel.marcarComoPagada(7);

  assert.equal(orden.estado, "Pagado");
  assert.ok(descuentaStock());
  assert.equal(advertencia.mock.callCount(), 1);
  assert.match(advertencia.mock.calls[0].arguments.join(" "), /Mouse/);
});

test("actualizarEstadoOrden descuenta stock cuando el admin marca la orden como Pagado", async () => {
  prepararCliente();
  estado.ordenActual = { estado: "Pendiente" };
  estado.nuevoEstado = "Pagado";

  await ordenModel.actualizarEstadoOrden(7, "Pagado", () => true);

  assert.ok(descuentaStock());
  assert.ok(!reponeStock());
});

test("actualizarEstadoOrden repone stock al cancelar una orden pagada", async () => {
  prepararCliente();
  estado.ordenActual = { estado: "Pagado" };
  estado.nuevoEstado = "Cancelado";

  const { orden, estadoAnterior } = await ordenModel.actualizarEstadoOrden(7, "Cancelado", () => true);

  assert.equal(orden.estado, "Cancelado");
  assert.equal(estadoAnterior, "Pagado");
  assert.ok(reponeStock());
  assert.equal(consultas().at(-1), "COMMIT");
});

test("actualizarEstadoOrden no repone stock al cancelar una orden pendiente", async () => {
  prepararCliente();
  estado.ordenActual = { estado: "Pendiente" };
  estado.nuevoEstado = "Cancelado";

  await ordenModel.actualizarEstadoOrden(7, "Cancelado", () => true);

  assert.ok(!reponeStock());
  assert.ok(!descuentaStock());
});

test("actualizarEstadoOrden rechaza una transición inválida con 409 y no modifica nada", async () => {
  prepararCliente();
  estado.ordenActual = { estado: "Cancelado" };

  await assert.rejects(ordenModel.actualizarEstadoOrden(7, "Enviado", () => false), {
    status: 409,
    message: "No se puede pasar una orden de Cancelado a Enviado",
  });
  assert.ok(!consultas().some((s) => s.startsWith("UPDATE")));
  assert.equal(consultas().at(-1), "ROLLBACK");
});

test("actualizarEstadoOrden responde 404 si la orden no existe", async () => {
  prepararCliente();

  await assert.rejects(ordenModel.actualizarEstadoOrden(7, "Pagado", () => true), {
    status: 404,
    message: "La orden especificada no existe",
  });
});

test("obtenerOrdenConDetalle no depende de columnas sin verificar en detalle_orden", async () => {
  const consultasPool = [];
  const db = require.cache[require.resolve("../src/config/db")].exports;
  db.query = async (sql, params) => {
    consultasPool.push(sql.replace(/\s+/g, " ").trim());
    return sql.includes("FROM orden") ? { rows: [{ id: 7 }] } : { rows: [] };
  };

  await ordenModel.obtenerOrdenConDetalle(7);

  const detalle = consultasPool.find((s) => s.includes("FROM detalle_orden"));
  assert.doesNotMatch(detalle, /d\.id\b(?!_)/);
});
