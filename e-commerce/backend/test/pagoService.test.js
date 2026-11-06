const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar } = require("./helpers");

const estado = {};

mockModule("mercadopago", {
  MercadoPagoConfig: class {
    constructor(opciones) {
      this.opciones = opciones;
    }
  },
  Preference: class {
    async create({ body }) {
      estado.preferenciaEnviada = body;
      return { init_point: "https://mp.test/checkout" };
    }
  },
  Payment: class {
    async get({ id }) {
      estado.pagoConsultado = id;
      return estado.pago;
    }
    async search({ options }) {
      estado.busqueda = options;
      estado.busquedas.push(options);
      // alBuscar puede devolver los resultados de esta búsqueda (necesario cuando corren en paralelo)
      const propios = estado.alBuscar ? await estado.alBuscar(options) : undefined;
      return { results: propios ?? estado.resultadosBusqueda };
    }
  },
  PaymentRefund: class {
    constructor(config) {
      this.config = config;
    }
    async total(datos) {
      estado.reembolsos.push({ ...datos, opciones: this.config.opciones.options });
      return { id: 1, status: "approved" };
    }
  },
});

mockModule("./src/config/db", {});
mockModule("./src/models/ordenModel", {
  async obtenerOrdenConDetalle(id) {
    estado.lecturas.push(id);
    return estado.ordenes[id] || null;
  },
  async obtenerOrdenesPorUsuario(usuarioId) {
    return Object.values(estado.ordenes).filter((o) => Number(o.id_usuario) === Number(usuarioId));
  },
  async marcarComoPagada(id) {
    estado.marcadas.push(id);
    const orden = estado.ordenes[id];
    if (estado.alMarcar) estado.alMarcar(orden);
    if (orden.estado !== "Pendiente") return null;
    orden.estado = "Pagado";
    return { ...orden };
  },
});

const pagoService = cargar("./src/services/pagoService");

function ordenPendiente() {
  return {
    id: 7,
    id_usuario: 3,
    estado: "Pendiente",
    fecha_pedido: new Date(),
    metodo_pago_nombre: "Mercado Pago",
    total: "1500.50",
    items: [
      { id_producto: 1, nombre: "Mouse", cantidad: 2, precio_unitario: "500.25" },
      { id_producto: 2, nombre: "Pad", cantidad: 1, precio_unitario: "500.00" },
    ],
  };
}

beforeEach(() => {
  process.env.MP_ACCESS_TOKEN = "TEST-token";
  process.env.FRONTEND_URL = "https://puntozero.test";
  delete process.env.BACKEND_PUBLIC_URL;
  estado.ordenes = { 7: ordenPendiente() };
  estado.marcadas = [];
  estado.reembolsos = [];
  estado.alMarcar = undefined;
  estado.preferenciaEnviada = undefined;
  estado.pago = undefined;
  estado.busquedas = [];
  estado.lecturas = [];
  estado.alBuscar = undefined;
  estado.resultadosBusqueda = [];
});

test("crearPreferencia arma los ítems y el monto desde la orden guardada, no desde el cliente", async () => {
  const resultado = await pagoService.crearPreferencia(3, 7);

  assert.deepEqual(resultado, { init_point: "https://mp.test/checkout" });
  assert.deepEqual(estado.preferenciaEnviada.items, [
    { id: "1", title: "Mouse", quantity: 2, unit_price: 500.25, currency_id: "ARS" },
    { id: "2", title: "Pad", quantity: 1, unit_price: 500, currency_id: "ARS" },
  ]);
  assert.equal(estado.preferenciaEnviada.external_reference, "7");
});

test("crearPreferencia redirige automáticamente a la página principal cuando el pago se aprueba", async () => {
  await pagoService.crearPreferencia(3, 7);

  assert.equal(estado.preferenciaEnviada.auto_return, "approved");
  assert.deepEqual(estado.preferenciaEnviada.back_urls, {
    success: "https://puntozero.test/?pago=exito",
    failure: "https://puntozero.test/?pago=fallido",
    pending: "https://puntozero.test/?pago=pendiente",
  });
});

test("crearPreferencia no envía auto_return con un FRONTEND_URL local", async () => {
  process.env.FRONTEND_URL = "http://localhost:5173/";

  await pagoService.crearPreferencia(3, 7);

  assert.equal(estado.preferenciaEnviada.auto_return, undefined);
  assert.equal(estado.preferenciaEnviada.back_urls.success, "http://localhost:5173/?pago=exito");
});

test("crearPreferencia agrega notification_url solo si BACKEND_PUBLIC_URL está definido", async () => {
  process.env.BACKEND_PUBLIC_URL = "https://api.puntozero.test/";

  await pagoService.crearPreferencia(3, 7);

  assert.equal(
    estado.preferenciaEnviada.notification_url,
    "https://api.puntozero.test/api/v1/pagos/webhook",
  );
});

test("crearPreferencia rechaza una orden de otro usuario con 404", async () => {
  await assert.rejects(pagoService.crearPreferencia(99, 7), { status: 404 });
  assert.equal(estado.preferenciaEnviada, undefined);
});

test("crearPreferencia rechaza una orden que ya no está pendiente con 409", async () => {
  estado.ordenes[7].estado = "Pagado";
  await assert.rejects(pagoService.crearPreferencia(3, 7), { status: 409 });
});

test("crearPreferencia responde 503 si falta MP_ACCESS_TOKEN", async () => {
  delete process.env.MP_ACCESS_TOKEN;
  await assert.rejects(pagoService.crearPreferencia(3, 7), { status: 503 });
});

test("confirmarPago marca la orden como Pagado cuando el pago aprobado coincide en monto", async () => {
  estado.pago = { status: "approved", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };

  const resultado = await pagoService.confirmarPago(3, "123");

  assert.equal(estado.pagoConsultado, "123");
  assert.equal(resultado.estadoPago, "approved");
  assert.equal(resultado.orden.estado, "Pagado");
  assert.deepEqual(estado.marcadas, [7]);
});

test("confirmarPago no marca la orden si el monto pagado no coincide", async () => {
  estado.pago = { status: "approved", external_reference: "7", transaction_amount: 1, currency_id: "ARS" };

  const resultado = await pagoService.confirmarPago(3, "123");

  assert.equal(resultado.orden.estado, "Pendiente");
  assert.deepEqual(estado.marcadas, []);
});

test("confirmarPago no marca la orden si el pago no está aprobado", async () => {
  estado.pago = { status: "rejected", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };

  const resultado = await pagoService.confirmarPago(3, "123");

  assert.equal(resultado.estadoPago, "rejected");
  assert.deepEqual(estado.marcadas, []);
});

test("confirmarPago rechaza el pago de una orden ajena con 404", async () => {
  estado.pago = { status: "approved", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };
  await assert.rejects(pagoService.confirmarPago(99, "123"), { status: 404 });
  assert.deepEqual(estado.marcadas, []);
});

test("confirmarPago es idempotente: una orden ya pagada se devuelve sin cambios", async () => {
  estado.ordenes[7].estado = "Pagado";
  estado.pago = { status: "approved", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };

  const resultado = await pagoService.confirmarPago(3, "123");

  assert.equal(resultado.orden.estado, "Pagado");
});

test("un pago aprobado para una orden cancelada se reembolsa completo", async (t) => {
  t.mock.method(console, "warn", () => {});
  estado.ordenes[7].estado = "Cancelado";
  estado.pago = { id: 123, status: "approved", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };

  const resultado = await pagoService.confirmarPago(3, "123");

  assert.deepEqual(estado.reembolsos, [
    { payment_id: 123, opciones: { idempotencyKey: "reembolso-orden-cancelada-123" } },
  ]);
  assert.equal(resultado.reembolsado, true);
  assert.equal(resultado.orden.estado, "Cancelado");
  assert.deepEqual(estado.marcadas, []);
});

test("reembolsa si la orden se canceló mientras se procesaba el pago", async (t) => {
  t.mock.method(console, "warn", () => {});
  estado.alMarcar = (orden) => {
    orden.estado = "Cancelado";
  };
  estado.pago = { id: 321, status: "approved", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };

  const resultado = await pagoService.confirmarPago(3, "321");

  assert.equal(resultado.reembolsado, true);
  assert.equal(estado.reembolsos[0].payment_id, 321);
});

test("el webhook también reembolsa pagos de órdenes canceladas", async (t) => {
  t.mock.method(console, "warn", () => {});
  estado.ordenes[7].estado = "Cancelado";
  estado.pago = { id: 555, status: "approved", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };

  await pagoService.procesarNotificacion("555");

  assert.equal(estado.reembolsos.length, 1);
  assert.equal(estado.reembolsos[0].payment_id, 555);
});

test("no se reembolsa un pago ya devuelto ni uno de una orden pendiente o pagada", async () => {
  estado.ordenes[7].estado = "Cancelado";
  estado.pago = { id: 1, status: "refunded", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };
  const devuelto = await pagoService.confirmarPago(3, "1");

  estado.ordenes[7].estado = "Pagado";
  estado.pago = { id: 2, status: "approved", external_reference: "7", transaction_amount: 1500.5, currency_id: "ARS" };
  const pagado = await pagoService.confirmarPago(3, "2");

  assert.deepEqual(estado.reembolsos, []);
  assert.equal(devuelto.reembolsado, false);
  assert.equal(pagado.reembolsado, false);
});

test("reembolsarPagosAprobadosDeOrden busca por external_reference y reembolsa solo los aprobados", async (t) => {
  t.mock.method(console, "warn", () => {});
  estado.resultadosBusqueda = [
    { id: 11, status: "approved", external_reference: "7" },
    { id: 12, status: "rejected", external_reference: "7" },
    { id: 13, status: "approved", external_reference: "70" },
  ];

  const reembolsados = await pagoService.reembolsarPagosAprobadosDeOrden(7);

  assert.deepEqual(estado.busqueda, { external_reference: "7", status: "approved" });
  assert.deepEqual(reembolsados, [11]);
  assert.deepEqual(estado.reembolsos, [
    { payment_id: 11, opciones: { idempotencyKey: "reembolso-orden-cancelada-11" } },
  ]);
});

test("reembolsarPagosAprobadosDeOrden no hace nada si Mercado Pago no está configurado", async () => {
  delete process.env.MP_ACCESS_TOKEN;
  estado.resultadosBusqueda = [{ id: 11, status: "approved", external_reference: "7" }];

  assert.deepEqual(await pagoService.reembolsarPagosAprobadosDeOrden(7), []);
  assert.deepEqual(estado.reembolsos, []);
});

test("un pago sin external_reference válido no consulta la base", async () => {
  estado.pago = { status: "approved", transaction_amount: 10, currency_id: "ARS" };
  estado.ordenes = new Proxy({}, { get: () => assert.fail("no debe consultar la orden") });

  assert.equal(await pagoService.procesarNotificacion("555"), null);
  await assert.rejects(pagoService.confirmarPago(3, "555"), { status: 404 });
});

test("procesarNotificacion ignora pagos sin orden asociada", async () => {
  estado.pago = { status: "approved", external_reference: "999", transaction_amount: 10, currency_id: "ARS" };
  assert.equal(await pagoService.procesarNotificacion("555"), null);
});

// --- Conciliación activa con Mercado Pago ---

const pagoAprobado = (extra = {}) => ({
  id: 555,
  status: "approved",
  external_reference: "7",
  transaction_amount: 1500.5,
  currency_id: "ARS",
  ...extra,
});

test("sincronizarOrden deja la orden Pagado cuando hay un pago aprobado con el monto correcto", async () => {
  estado.resultadosBusqueda = [pagoAprobado()];

  const resultado = await pagoService.sincronizarOrden(7);

  assert.deepEqual(estado.busqueda, { external_reference: "7" });
  assert.equal(resultado.orden.estado, "Pagado");
  assert.equal(resultado.reembolsado, false);
  assert.deepEqual(estado.marcadas, [7]);
});

test("sincronizarOrden ignora pagos de otra referencia", async () => {
  estado.resultadosBusqueda = [pagoAprobado({ external_reference: "8" })];

  const resultado = await pagoService.sincronizarOrden(7);

  assert.equal(resultado.orden.estado, "Pendiente");
  assert.deepEqual(estado.marcadas, []);
});

test("sincronizarOrden deja la orden Pendiente si no hay pagos o están pending", async () => {
  estado.resultadosBusqueda = [];
  assert.equal((await pagoService.sincronizarOrden(7)).orden.estado, "Pendiente");

  estado.resultadosBusqueda = [pagoAprobado({ status: "pending" })];
  assert.equal((await pagoService.sincronizarOrden(7)).orden.estado, "Pendiente");
  assert.deepEqual(estado.marcadas, []);
});

test("sincronizarOrden no marca la orden si el monto pagado es distinto", async () => {
  estado.resultadosBusqueda = [pagoAprobado({ transaction_amount: 1 })];

  const resultado = await pagoService.sincronizarOrden(7);

  assert.equal(resultado.orden.estado, "Pendiente");
  assert.deepEqual(estado.marcadas, []);
});

test("sincronizarOrden no consulta a Mercado Pago si la orden ya no está pendiente", async () => {
  estado.ordenes[7].estado = "Pagado";

  const resultado = await pagoService.sincronizarOrden(7);

  assert.equal(resultado.orden.estado, "Pagado");
  assert.deepEqual(estado.busquedas, []);
});

test("sincronizarOrden de una orden inexistente lanza 404", async () => {
  await assert.rejects(pagoService.sincronizarOrden(99), { status: 404 });
});

test("sincronizarOrden sin MP_ACCESS_TOKEN devuelve la orden sin cambios y sin error", async () => {
  delete process.env.MP_ACCESS_TOKEN;
  estado.resultadosBusqueda = [pagoAprobado()];

  const resultado = await pagoService.sincronizarOrden(7);

  assert.equal(resultado.orden.estado, "Pendiente");
  assert.equal(resultado.reembolsado, false);
  assert.deepEqual(estado.busquedas, []);
});

test("sincronizarOrden reembolsa el pago aprobado de una orden pendiente que se canceló mientras tanto", async (t) => {
  t.mock.method(console, "warn", () => {});
  estado.alMarcar = (orden) => {
    orden.estado = "Cancelado";
  };
  estado.resultadosBusqueda = [pagoAprobado()];

  const resultado = await pagoService.sincronizarOrden(7);

  assert.equal(resultado.reembolsado, true);
  assert.equal(estado.reembolsos.length, 1);
});

test("sincronizarOrdenDelUsuario rechaza la orden de otro usuario con 404 sin consultar a Mercado Pago", async () => {
  await assert.rejects(pagoService.sincronizarOrdenDelUsuario(99, 7), { status: 404 });
  assert.deepEqual(estado.busquedas, []);
});

test("sincronizarOrdenDelUsuario sincroniza la orden propia", async () => {
  estado.resultadosBusqueda = [pagoAprobado()];

  const resultado = await pagoService.sincronizarOrdenDelUsuario(3, 7);

  assert.equal(resultado.orden.estado, "Pagado");
});

test("sincronizarPendientesDelUsuario devuelve las órdenes y los ids que pasaron a Pagado", async () => {
  estado.ordenes[8] = { ...ordenPendiente(), id: 8, total: "10" };
  estado.ordenes[9] = { ...ordenPendiente(), id: 9, estado: "Entregado" };
  estado.ordenes[10] = { ...ordenPendiente(), id: 10, id_usuario: 99 };
  estado.alBuscar = ({ external_reference }) =>
    external_reference === "7" ? [pagoAprobado()] : [];

  const resultado = await pagoService.sincronizarPendientesDelUsuario(3);

  assert.deepEqual(resultado.pagadas, [7]);
  assert.deepEqual(
    resultado.ordenes.map((o) => [o.id, o.estado]),
    [[7, "Pagado"], [8, "Pendiente"], [9, "Entregado"]],
  );
  assert.deepEqual(estado.busquedas.map((b) => b.external_reference), ["7", "8"]);
});

test("sincronizarPendientesDelUsuario sigue con las demás si una orden falla", async (t) => {
  t.mock.method(console, "error", () => {});
  estado.ordenes[8] = { ...ordenPendiente(), id: 8 };
  estado.alBuscar = ({ external_reference }) => {
    if (external_reference === "7") throw new Error("MP caído");
    return [pagoAprobado({ external_reference: "8" })];
  };

  const resultado = await pagoService.sincronizarPendientesDelUsuario(3);

  assert.deepEqual(resultado.pagadas, [8]);
  assert.equal(resultado.ordenes.find((o) => o.id === 7).estado, "Pendiente");
});

test("sincronizarPendientesDelUsuario sin MP_ACCESS_TOKEN no cambia nada", async () => {
  delete process.env.MP_ACCESS_TOKEN;

  const resultado = await pagoService.sincronizarPendientesDelUsuario(3);

  assert.deepEqual(resultado.pagadas, []);
  assert.deepEqual(estado.busquedas, []);
});

// --- Conciliación acotada: solo órdenes recientes de Mercado Pago, en paralelo ---

const haceDias = (dias) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

test("sincronizarPendientesDelUsuario no busca en Mercado Pago las órdenes en efectivo", async () => {
  estado.ordenes[7].metodo_pago_nombre = "Efectivo";
  estado.ordenes[8] = { ...ordenPendiente(), id: 8, metodo_pago_nombre: null };

  const resultado = await pagoService.sincronizarPendientesDelUsuario(3);

  assert.deepEqual(estado.busquedas, []);
  assert.deepEqual(resultado.pagadas, []);
  assert.deepEqual(resultado.ordenes.map((o) => o.id), [7, 8]);
});

test("sincronizarPendientesDelUsuario no busca las órdenes de Mercado Pago de hace más de 7 días", async () => {
  estado.ordenes[7].fecha_pedido = haceDias(30);
  estado.ordenes[8] = { ...ordenPendiente(), id: 8, fecha_pedido: haceDias(8) };
  estado.ordenes[9] = { ...ordenPendiente(), id: 9, fecha_pedido: haceDias(6) };

  await pagoService.sincronizarPendientesDelUsuario(3);

  assert.deepEqual(estado.busquedas.map((b) => b.external_reference), ["9"]);
});

test("sincronizarPendientesDelUsuario concilia una orden de Mercado Pago o tarjeta de hoy", async () => {
  estado.ordenes[8] = { ...ordenPendiente(), id: 8, metodo_pago_nombre: "Tarjeta de crédito" };
  estado.resultadosBusqueda = [pagoAprobado()];

  const resultado = await pagoService.sincronizarPendientesDelUsuario(3);

  assert.deepEqual(estado.busquedas.map((b) => b.external_reference).sort(), ["7", "8"]);
  assert.deepEqual(resultado.pagadas, [7]);
  assert.equal(resultado.ordenes.find((o) => o.id === 7).estado, "Pagado");
});

test("sincronizarPendientesDelUsuario concilia en paralelo con un máximo de 4 búsquedas simultáneas", async () => {
  for (let id = 8; id <= 13; id += 1) estado.ordenes[id] = { ...ordenPendiente(), id };
  let enVuelo = 0;
  let maximo = 0;
  estado.alBuscar = async () => {
    enVuelo += 1;
    maximo = Math.max(maximo, enVuelo);
    await esperar(20);
    enVuelo -= 1;
  };

  await pagoService.sincronizarPendientesDelUsuario(3);

  assert.equal(estado.busquedas.length, 7);
  assert.ok(maximo > 1, `se esperaba paralelismo, máximo simultáneo: ${maximo}`);
  assert.ok(maximo <= 4, `se esperaban como mucho 4 simultáneas, hubo ${maximo}`);
});

test("sincronizarPendientesDelUsuario no corta las demás si una búsqueda falla en paralelo", async (t) => {
  t.mock.method(console, "error", () => {});
  estado.ordenes[8] = { ...ordenPendiente(), id: 8 };
  estado.ordenes[9] = { ...ordenPendiente(), id: 9 };
  estado.alBuscar = async ({ external_reference }) => {
    await esperar(5);
    if (external_reference === "8") throw new Error("MP caído");
    return [pagoAprobado({ external_reference })];
  };

  const resultado = await pagoService.sincronizarPendientesDelUsuario(3);

  assert.deepEqual(resultado.ordenes.map((o) => o.id), [7, 8, 9]);
  assert.equal(resultado.ordenes.find((o) => o.id === 8).estado, "Pendiente");
  assert.ok(resultado.pagadas.includes(9));
});

test("sincronizarPendientesDelUsuario no vuelve a leer cada orden del listado", async () => {
  estado.ordenes[8] = { ...ordenPendiente(), id: 8 };
  estado.resultadosBusqueda = [];

  await pagoService.sincronizarPendientesDelUsuario(3);

  assert.equal(estado.busquedas.length, 2);
  assert.deepEqual(estado.lecturas, []);
});

test("sincronizarPendientesDelUsuario marca como pagada una orden conocida sin releerla", async () => {
  const { items, ...sinItems } = ordenPendiente();
  estado.ordenes[7] = sinItems;
  estado.resultadosBusqueda = [pagoAprobado()];

  const resultado = await pagoService.sincronizarPendientesDelUsuario(3);

  assert.deepEqual(estado.marcadas, [7]);
  assert.deepEqual(resultado.pagadas, [7]);
  assert.deepEqual(estado.lecturas, []);
});

test("sincronizarOrden relee la orden conocida solo si le falta total, estado o id", async () => {
  estado.resultadosBusqueda = [pagoAprobado()];

  const resultado = await pagoService.sincronizarOrden(7, { id: 7, estado: "Pendiente" });

  assert.deepEqual(estado.lecturas, [7]);
  assert.equal(resultado.orden.estado, "Pagado");
});

test("sincronizarOrdenDelUsuario sigue sin ventana de 7 días ni filtro de método", async () => {
  estado.ordenes[7].fecha_pedido = haceDias(30);
  estado.ordenes[7].metodo_pago_nombre = "Efectivo";
  estado.resultadosBusqueda = [pagoAprobado()];

  const resultado = await pagoService.sincronizarOrdenDelUsuario(3, 7);

  assert.equal(estado.busquedas.length, 1);
  assert.equal(resultado.orden.estado, "Pagado");
});
