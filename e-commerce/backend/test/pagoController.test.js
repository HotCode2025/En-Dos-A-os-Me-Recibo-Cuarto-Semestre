const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar, crearRes } = require("./helpers");

const estado = {};

mockModule("mercadopago", {
  WebhookSignatureValidator: {
    validate(opciones) {
      estado.validacion = opciones;
      if (opciones.xSignature !== "firma-valida") throw new Error("SignatureMismatch");
    },
  },
});
mockModule("./src/config/db", {});
mockModule("./src/services/pagoService", {
  async crearPreferencia(usuarioId, ordenId) {
    if (estado.errorPreferencia) throw estado.errorPreferencia;
    estado.preferencia = [usuarioId, ordenId];
    return { init_point: "https://mp.test" };
  },
  async confirmarPago(usuarioId, paymentId) {
    if (estado.errorConfirmar) throw estado.errorConfirmar;
    estado.confirmado = [usuarioId, paymentId];
    return { estadoPago: "approved", orden: { id: 7, estado: "Pagado" } };
  },
  async sincronizarOrdenDelUsuario(usuarioId, ordenId) {
    estado.sincronizada = ["cliente", usuarioId, ordenId];
    if (estado.errorSincronizar) throw estado.errorSincronizar;
    return { orden: { id: ordenId, estado: "Pagado" }, reembolsado: false };
  },
  async sincronizarOrden(ordenId) {
    estado.sincronizada = ["admin", ordenId];
    return { orden: { id: ordenId, estado: "Pagado" }, reembolsado: false };
  },
  async sincronizarPendientesDelUsuario(usuarioId) {
    if (estado.errorPendientes) throw estado.errorPendientes;
    estado.pendientes = usuarioId;
    return { ordenes: [{ id: 7, estado: "Pagado" }], pagadas: [7] };
  },
  async procesarNotificacion(paymentId) {
    estado.notificado = paymentId;
    return null;
  },
});

const pagoController = cargar("./src/controllers/pagoController");

beforeEach(() => {
  delete process.env.MP_WEBHOOK_SECRET;
  estado.preferencia = estado.confirmado = estado.notificado = estado.validacion = undefined;
  estado.sincronizada = estado.pendientes = estado.errorSincronizar = undefined;
  estado.errorPreferencia = estado.errorConfirmar = estado.errorPendientes = undefined;
});

test("crearPreferencia ignora el total enviado por el cliente", async () => {
  const res = crearRes();
  await pagoController.crearPreferencia({ usuario: { id: 3 }, body: { ordenId: 7, total: 1 } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(estado.preferencia, [3, 7]);
  assert.deepEqual(res.body, { init_point: "https://mp.test" });
});

test("crearPreferencia valida ordenId", async () => {
  const res = crearRes();
  await pagoController.crearPreferencia({ usuario: { id: 3 }, body: { ordenId: "x" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(estado.preferencia, undefined);
});

test("confirmarPago valida paymentId y delega en el servicio", async () => {
  const invalida = crearRes();
  await pagoController.confirmarPago({ usuario: { id: 3 }, body: { paymentId: "null" } }, invalida);
  assert.equal(invalida.statusCode, 400);

  const res = crearRes();
  await pagoController.confirmarPago({ usuario: { id: 3 }, body: { paymentId: "123" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(estado.confirmado, [3, "123"]);
});

test("webhook procesa notificaciones de pago y responde 200", async () => {
  const res = crearRes();
  await pagoController.webhook({ headers: {}, query: { type: "payment", "data.id": "555" }, body: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(estado.notificado, "555");
});

test("webhook ignora notificaciones que no son de pagos", async () => {
  const res = crearRes();
  await pagoController.webhook({ headers: {}, query: {}, body: { type: "merchant_order", data: { id: "1" } } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(estado.notificado, undefined);
});

test("webhook rechaza con 401 una firma inválida cuando MP_WEBHOOK_SECRET está definido", async () => {
  process.env.MP_WEBHOOK_SECRET = "secreto";
  const req = {
    headers: { "x-signature": "firma-falsa", "x-request-id": "req-1" },
    query: { type: "payment", "data.id": "555" },
    body: {},
  };

  const res = crearRes();
  await pagoController.webhook(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(estado.notificado, undefined);
  assert.deepEqual(estado.validacion, {
    xSignature: "firma-falsa",
    xRequestId: "req-1",
    dataId: "555",
    secret: "secreto",
  });
});

test("webhook acepta una firma válida", async () => {
  process.env.MP_WEBHOOK_SECRET = "secreto";
  const res = crearRes();
  await pagoController.webhook(
    { headers: { "x-signature": "firma-valida", "x-request-id": "r" }, query: { type: "payment", "data.id": "9" }, body: {} },
    res,
  );
  assert.equal(res.statusCode, 200);
  assert.equal(estado.notificado, "9");
});

test("sincronizarOrden: un cliente sincroniza solo su orden", async () => {
  const res = crearRes();
  await pagoController.sincronizarOrden({ usuario: { id: 3, rol: "CLIENTE" }, params: { ordenId: "7" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(estado.sincronizada, ["cliente", 3, 7]);
  assert.deepEqual(res.body, { orden: { id: 7, estado: "Pagado" }, reembolsado: false });
});

test("sincronizarOrden: un ADMIN sincroniza cualquier orden", async () => {
  const res = crearRes();
  await pagoController.sincronizarOrden({ usuario: { id: 1, rol: "ADMIN" }, params: { ordenId: "7" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(estado.sincronizada, ["admin", 7]);
});

test("sincronizarOrden: una orden ajena responde 404", async (t) => {
  t.mock.method(console, "error", () => {});
  const HttpError = require("../src/utils/httpError");
  estado.errorSincronizar = new HttpError(404, "La orden especificada no existe");
  const res = crearRes();
  await pagoController.sincronizarOrden({ usuario: { id: 99, rol: "CLIENTE" }, params: { ordenId: "7" } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "La orden especificada no existe" });
});

test("sincronizarOrden: un id inválido responde 400 sin llamar al servicio", async () => {
  const res = crearRes();
  await pagoController.sincronizarOrden({ usuario: { id: 3, rol: "CLIENTE" }, params: { ordenId: "abc" } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(estado.sincronizada, undefined);
});

test("sincronizarPendientes devuelve las órdenes y las pagadas del usuario logueado", async () => {
  const res = crearRes();
  await pagoController.sincronizarPendientes({ usuario: { id: 3, rol: "CLIENTE" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(estado.pendientes, 3);
  assert.deepEqual(res.body, { ordenes: [{ id: 7, estado: "Pagado" }], pagadas: [7] });
});

test("las rutas declaran sincronizar-pendientes antes de sincronizar/:ordenId", () => {
  mockModule("./src/middlewares/autenticacionMiddleware", { verificarToken: () => {} });
  const router = cargar("./src/routes/pagoRoute");
  const rutas = router.stack.filter((capa) => capa.route).map((capa) => capa.route.path);

  assert.ok(rutas.includes("/sincronizar/:ordenId"));
  assert.ok(rutas.indexOf("/sincronizar-pendientes") >= 0);
  assert.ok(rutas.indexOf("/sincronizar-pendientes") < rutas.indexOf("/sincronizar/:ordenId"));
});

test("un error común con status (como MercadoPagoError 401) responde 502 sin exponer su mensaje", async (t) => {
  t.mock.method(console, "error", () => {});
  const errorDelSdk = Object.assign(new Error("invalid access token de Mercado Pago"), { status: 401 });
  estado.errorSincronizar = errorDelSdk;

  const res = crearRes();
  await pagoController.sincronizarOrden({ usuario: { id: 3, rol: "CLIENTE" }, params: { ordenId: "7" } }, res);

  assert.equal(res.statusCode, 502);
  assert.ok(!JSON.stringify(res.body).includes("access token"));
  assert.ok(res.body.error);
});

test("crearPreferencia y confirmarPago no propagan el status de errores ajenos a HttpError", async (t) => {
  t.mock.method(console, "error", () => {});
  const HttpError = require("../src/utils/httpError");
  const ajeno = Object.assign(new Error("detalle interno"), { status: 401 });
  estado.errorPreferencia = ajeno;
  estado.errorConfirmar = ajeno;

  const resPref = crearRes();
  await pagoController.crearPreferencia({ usuario: { id: 3 }, body: { ordenId: 7 } }, resPref);
  assert.equal(resPref.statusCode, 502);
  assert.ok(!JSON.stringify(resPref.body).includes("detalle interno"));

  const resConf = crearRes();
  await pagoController.confirmarPago({ usuario: { id: 3 }, body: { paymentId: "123" } }, resConf);
  assert.equal(resConf.statusCode, 502);
  assert.ok(!JSON.stringify(resConf.body).includes("detalle interno"));

  estado.errorPreferencia = new HttpError(404, "La orden especificada no existe");
  const resHttp = crearRes();
  await pagoController.crearPreferencia({ usuario: { id: 3 }, body: { ordenId: 7 } }, resHttp);
  assert.equal(resHttp.statusCode, 404);
  assert.deepEqual(resHttp.body, { error: "La orden especificada no existe" });
});

test("sincronizarPendientes tampoco expone el status de errores ajenos a HttpError", async (t) => {
  t.mock.method(console, "error", () => {});
  estado.errorPendientes = Object.assign(new Error("secreto"), { status: 401 });
  const res = crearRes();
  await pagoController.sincronizarPendientes({ usuario: { id: 3, rol: "CLIENTE" } }, res);
  assert.equal(res.statusCode, 502);
  assert.ok(!JSON.stringify(res.body).includes("secreto"));
});
