const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar } = require("./helpers");

const estado = {};

mockModule("./src/config/db", {});
mockModule("./src/models/carritoModel", {});
mockModule("./src/models/metodoPagoModel", {
  async getById(id) {
    return estado.metodos[id];
  },
});
mockModule("./src/models/ordenModel", {
  async crearOrdenTransaccional(...args) {
    estado.creada = args;
    return { orden: { id: 7 }, items: [] };
  },
  async actualizarEstadoOrden(ordenId, nuevoEstado, esTransicionValida) {
    estado.transicion = esTransicionValida;
    return { orden: { id: ordenId, estado: nuevoEstado }, estadoAnterior: estado.estadoAnterior };
  },
});
mockModule("./src/services/pagoService", {
  async reembolsarPagosAprobadosDeOrden(ordenId) {
    estado.reembolsoPedido = ordenId;
    if (estado.falloReembolso) throw new Error("MP caído");
    return estado.pagosReembolsados;
  },
});

const ordenService = cargar("./src/services/ordenService");

beforeEach(() => {
  estado.metodos = { 1: { id: 1, activo: true }, 2: { id: 2, activo: false } };
  estado.creada = undefined;
  estado.estadoAnterior = "Pendiente";
  estado.reembolsoPedido = undefined;
  estado.falloReembolso = false;
  estado.pagosReembolsados = [];
});

test("actualizarEstado devuelve la orden actualizada sin reembolsar en otros casos", async () => {
  const resultado = await ordenService.actualizarEstado(7, "Cancelado");

  assert.deepEqual(resultado, { orden: { id: 7, estado: "Cancelado" }, reembolsos: [] });
  assert.equal(estado.reembolsoPedido, undefined);
});

test("cancelar una orden pagada reembolsa sus pagos aprobados de Mercado Pago", async () => {
  estado.estadoAnterior = "Pagado";
  estado.pagosReembolsados = [123];

  const resultado = await ordenService.actualizarEstado(7, "Cancelado");

  assert.equal(estado.reembolsoPedido, 7);
  assert.deepEqual(resultado.reembolsos, [123]);
});

test("si el reembolso falla responde 502 y avisa que la orden quedó cancelada", async (t) => {
  t.mock.method(console, "error", () => {});
  estado.estadoAnterior = "Pagado";
  estado.falloReembolso = true;

  await assert.rejects(ordenService.actualizarEstado(7, "Cancelado"), {
    status: 502,
    message:
      "La orden #7 se canceló, pero no se pudo reembolsar el pago en Mercado Pago. Debe reembolsarse manualmente desde el panel de Mercado Pago.",
  });
});

test("crearOrdenDesdeCarrito crea la orden con el método activo y sin dirección de envío", async () => {
  const resultado = await ordenService.crearOrdenDesdeCarrito(3, 1);

  assert.deepEqual(estado.creada, [3, 1]);
  assert.equal(resultado.mensaje, "Orden creada exitosamente");
});

test("crearOrdenDesdeCarrito no depende de la tabla direccion, que no existe en la base", () => {
  const fuente = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "../src/services/ordenService.js"),
    "utf8",
  );
  assert.doesNotMatch(fuente, /direccionModel|FROM direccion/);
});

test("crearOrdenDesdeCarrito rechaza métodos de pago inactivos o inexistentes", async () => {
  await assert.rejects(ordenService.crearOrdenDesdeCarrito(3, 2), { status: 400 });
  await assert.rejects(ordenService.crearOrdenDesdeCarrito(3, 50), { status: 400 });
  assert.equal(estado.creada, undefined);
});

test("actualizarEstado conserva el mensaje para estados desconocidos", async () => {
  await assert.rejects(ordenService.actualizarEstado(7, "Perdido"), {
    message: "Estado inválido. Los estados permitidos son: Pendiente, Pagado, Enviado, Entregado, Cancelado",
  });
});

test("actualizarEstado aplica las transiciones permitidas", async () => {
  await ordenService.actualizarEstado(7, "Pagado");
  const valida = estado.transicion;

  assert.equal(valida("Pendiente", "Pagado"), true);
  assert.equal(valida("Pendiente", "Cancelado"), true);
  assert.equal(valida("Pagado", "Enviado"), true);
  assert.equal(valida("Pagado", "Cancelado"), true);
  assert.equal(valida("Enviado", "Entregado"), true);
  assert.equal(valida("Cancelado", "Enviado"), false);
  assert.equal(valida("Entregado", "Pendiente"), false);
  assert.equal(valida("Pendiente", "Entregado"), false);
});
