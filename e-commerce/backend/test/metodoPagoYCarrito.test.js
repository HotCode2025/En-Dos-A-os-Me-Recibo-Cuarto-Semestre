const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar, crearRes } = require("./helpers");

const consultas = [];

mockModule("./src/config/db", {
  async query(sql, params) {
    consultas.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
    return { rows: [{ id: 1, activo: false }] };
  },
});
mockModule("./src/services/carritoService", {
  async quitarItem(usuarioId, productoId) {
    consultas.push({ quitar: [usuarioId, productoId] });
  },
});

const metodoPagoService = cargar("./src/services/metodoPagoService");
const carritoController = cargar("./src/controllers/carritoController");

beforeEach(() => {
  consultas.length = 0;
});

test("listarMetodosPago devuelve solo los métodos activos", async () => {
  await metodoPagoService.listarMetodosPago();
  assert.match(consultas[0].sql, /WHERE activo = true/);
});

test("eliminarMetodoPago desactiva el método en lugar de borrarlo", async () => {
  await metodoPagoService.eliminarMetodoPago(1);

  const sqls = consultas.map((c) => c.sql);
  assert.ok(sqls.some((s) => s.startsWith("UPDATE metodo_pago SET activo = false")));
  assert.ok(!sqls.some((s) => s.startsWith("DELETE")));
});

test("quitarProducto rechaza un productoId que no es entero positivo", async () => {
  for (const productoId of ["abc", "0", "-3", "1.5"]) {
    const res = crearRes();
    await carritoController.quitarProducto({ usuario: { id: 3 }, params: { productoId } }, res);
    assert.equal(res.statusCode, 400, productoId);
  }
  assert.equal(consultas.length, 0);
});

test("quitarProducto sigue quitando con un ID válido", async () => {
  const res = crearRes();
  await carritoController.quitarProducto({ usuario: { id: 3 }, params: { productoId: "5" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(consultas[0].quitar, [3, 5]);
});
