const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar, crearClienteFalso } = require("./helpers");

const estado = {};

mockModule("./src/config/db", {
  async connect() {
    return estado.cliente;
  },
});

const ordenModel = cargar("./src/models/ordenModel");
const { validarEntorno } = cargar("./src/config/env");

function cancelarOrdenPagada(fechaPedido) {
  estado.cliente = crearClienteFalso((sql) => {
    if (sql.includes("SELECT estado")) {
      return { rows: [{ estado: "Pagado", fecha_pedido: new Date(fechaPedido) }] };
    }
    if (sql.includes("UPDATE orden SET estado = $1")) return { rows: [{ id: 7, estado: "Cancelado" }] };
    return { rows: [] };
  });
  return ordenModel.actualizarEstadoOrden(7, "Cancelado", () => true).then((r) => r.orden);
}

const reponeStock = () =>
  estado.cliente.consultas.some((c) => c.sql.includes("SET stock = p.stock + d.cantidad"));

beforeEach(() => {
  delete process.env.STOCK_AL_PAGAR_DESDE;
});
afterEach(() => {
  delete process.env.STOCK_AL_PAGAR_DESDE;
});

test("sin STOCK_AL_PAGAR_DESDE, cancelar una orden pagada repone stock", async () => {
  await cancelarOrdenPagada("2026-01-01T10:00:00Z");
  assert.equal(reponeStock(), true);
});

test("una orden pagada anterior a la fecha de corte no repone stock al cancelarse", async () => {
  process.env.STOCK_AL_PAGAR_DESDE = "2026-11-06T00:00:00Z";

  const orden = await cancelarOrdenPagada("2026-11-05T23:59:59Z");

  assert.equal(orden.estado, "Cancelado");
  assert.equal(reponeStock(), false);
});

test("una orden pagada desde la fecha de corte repone stock al cancelarse", async () => {
  process.env.STOCK_AL_PAGAR_DESDE = "2026-11-06T00:00:00Z";
  await cancelarOrdenPagada("2026-11-06T00:00:00Z");
  assert.equal(reponeStock(), true);
});

test("validarEntorno rechaza una STOCK_AL_PAGAR_DESDE que no es fecha", () => {
  const base = { DATABASE_URL: "postgres://x", JWT_SECRET: "s" };

  assert.throws(() => validarEntorno({ ...base, STOCK_AL_PAGAR_DESDE: "mañana" }), {
    message: "STOCK_AL_PAGAR_DESDE no es una fecha válida (usar formato ISO, por ejemplo 2026-11-06)",
  });
  assert.doesNotThrow(() => validarEntorno({ ...base, STOCK_AL_PAGAR_DESDE: "2026-11-06" }));
});
