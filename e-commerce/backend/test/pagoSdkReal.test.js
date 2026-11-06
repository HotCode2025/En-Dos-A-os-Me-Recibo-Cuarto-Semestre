// Uses the real mercadopago SDK with fetch stubbed (no network) to pin request headers.
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar } = require("./helpers");

const ordenes = {
  7: { id: 7, id_usuario: 3, estado: "Cancelado", total: "100.00", items: [] },
  8: {
    id: 8,
    id_usuario: 3,
    estado: "Pendiente",
    total: "100.00",
    items: [{ id_producto: 1, nombre: "Mouse", cantidad: 1, precio_unitario: "100.00" }],
  },
};

mockModule("./src/config/db", {});
mockModule("./src/models/ordenModel", {
  async obtenerOrdenConDetalle(id) {
    return ordenes[id] || null;
  },
  async marcarComoPagada() {
    return null;
  },
});

const peticiones = [];
const fetchOriginal = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const headers = new Headers(init.headers);
  peticiones.push({ url: String(url), metodo: init.method, clave: headers.get("x-idempotency-key") });
  const pagoAprobado = { id: 123, status: "approved", external_reference: "7", transaction_amount: 100, currency_id: "ARS" };
  const cuerpo = String(url).includes("/v1/payments/search")
    ? { results: [pagoAprobado] }
    : String(url).includes("/v1/payments/123")
      ? pagoAprobado
      : { id: "x", init_point: "https://mp.test/checkout" };
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
after(() => {
  globalThis.fetch = fetchOriginal;
});

process.env.MP_ACCESS_TOKEN = "TEST-token";
process.env.FRONTEND_URL = "https://puntozero.test";
const pagoService = cargar("./src/services/pagoService");

test("la clave de idempotencia del reembolso no se filtra a los checkouts siguientes", async (t) => {
  t.mock.method(console, "warn", () => {});

  const resultado = await pagoService.confirmarPago(3, "123");
  await pagoService.crearPreferencia(3, 8);
  await pagoService.crearPreferencia(3, 8);

  assert.equal(resultado.reembolsado, true);
  const reembolso = peticiones.find((p) => p.url.includes("/refunds"));
  assert.equal(reembolso.clave, "reembolso-orden-cancelada-123");

  const preferencias = peticiones.filter((p) => p.url.includes("/checkout/preferences"));
  assert.equal(preferencias.length, 2);
  for (const preferencia of preferencias) {
    assert.ok(preferencia.clave, "cada preferencia lleva su propia clave");
    assert.notEqual(preferencia.clave, "reembolso-orden-cancelada-123");
  }
  assert.notEqual(preferencias[0].clave, preferencias[1].clave);
});

test("cancelar una orden pagada busca sus pagos por external_reference y usa la misma clave de reembolso", async (t) => {
  t.mock.method(console, "warn", () => {});
  peticiones.length = 0;

  const reembolsados = await pagoService.reembolsarPagosAprobadosDeOrden(7);

  const busqueda = new URL(peticiones.find((p) => p.url.includes("/v1/payments/search")).url);
  assert.equal(busqueda.searchParams.get("external_reference"), "7");
  assert.equal(busqueda.searchParams.get("status"), "approved");
  assert.deepEqual(reembolsados, [123]);
  assert.equal(peticiones.find((p) => p.url.includes("/refunds")).clave, "reembolso-orden-cancelada-123");
});
