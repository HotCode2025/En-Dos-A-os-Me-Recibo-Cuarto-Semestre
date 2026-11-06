const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar, crearRes } = require("./helpers");

process.env.JWT_SECRET = "clave-de-prueba-admin";

const consultas = [];
const llamadas = [];
let filas = [];

mockModule("./src/config/db", {
  async query(sql, params) {
    consultas.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
    return { rows: filas };
  },
});
mockModule("./src/services/ordenService", {
  async actualizarEstado(ordenId, nuevoEstado) {
    llamadas.push({ actualizarEstado: [ordenId, nuevoEstado] });
    return { orden: { id: ordenId, estado: nuevoEstado }, reembolsos: [] };
  },
  async crearOrdenDesdeCarrito(usuarioId, metodoPagoId) {
    llamadas.push({ crear: [usuarioId, metodoPagoId] });
    return {};
  },
});
mockModule("./src/services/carritoService", {
  async agregarItem() {
    llamadas.push("agregar");
  },
  async restarItem() {
    llamadas.push("restar");
  },
});

const HttpError = cargar("./src/utils/httpError");
const metodoPagoService = cargar("./src/services/metodoPagoService");
const metodoPagoController = cargar("./src/controllers/metodoPagoController");
const ordenController = cargar("./src/controllers/ordenController");
const carritoController = cargar("./src/controllers/carritoController");
const usuarioService = cargar("./src/services/UsuarioService");
const jwtUtils = cargar("./src/utils/jwtUtils");

beforeEach(() => {
  consultas.length = 0;
  llamadas.length = 0;
  filas = [{ id: 1, nombre: "Efectivo", activo: true }];
});

test("listarTodosMetodosPago trae activos e inactivos, sin filtrar", async () => {
  await metodoPagoService.listarTodosMetodosPago();

  assert.doesNotMatch(consultas[0].sql, /WHERE/);
});

test("listarMetodosPago sigue trayendo solo los activos para el checkout", async () => {
  await metodoPagoService.listarMetodosPago();

  assert.match(consultas[0].sql, /WHERE activo = true/);
});

test("el PUT de un método de pago reactiva con activo: true", async () => {
  filas = [{ id: 4, nombre: "Transferencia", activo: false }];

  await metodoPagoService.actualizarMetodoPago(4, { activo: true });

  const actualizacion = consultas.find((c) => c.sql.startsWith("UPDATE metodo_pago"));
  assert.deepEqual(actualizacion.params, [undefined, undefined, undefined, true, 4]);
});

test("el PUT de un método de pago rechaza un activo que no es booleano", async () => {
  await assert.rejects(metodoPagoService.actualizarMetodoPago(4, { activo: "si" }), (e) => {
    assert.ok(e instanceof HttpError);
    assert.equal(e.status, 400);
    return true;
  });
  assert.equal(consultas.length, 0);
});

test("actualizar un método de pago inexistente responde 404", async () => {
  filas = [];
  const res = crearRes();

  await metodoPagoController.actualizarMetodoPago({ params: { id: "9" }, body: { activo: true } }, res, assert.fail);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Método de pago no encontrado" });
});

test("crear un método de pago sin body responde error de validación, no un TypeError", async () => {
  await assert.rejects(metodoPagoService.crearMetodoPago(undefined), /nombre del método de pago es obligatorio/);
});

test("actualizar un método de pago sin body no rompe", async () => {
  await assert.doesNotReject(metodoPagoService.actualizarMetodoPago(1, undefined));
});

test("los controllers de métodos de pago rechazan un id inválido con 400 sin tocar la base", async () => {
  for (const id of ["abc", "0", "-1", "1.5"]) {
    for (const metodo of ["getMetodoPagoById", "actualizarMetodoPago", "eliminarMetodoPago"]) {
      const res = crearRes();
      await metodoPagoController[metodo]({ params: { id }, body: {} }, res, assert.fail);
      assert.equal(res.statusCode, 400, `${metodo} ${id}`);
      assert.ok(res.body.error);
    }
  }
  assert.equal(consultas.length, 0);
});

test("actualizarEstado de una orden rechaza un id inválido con 400", async () => {
  const res = crearRes();

  await ordenController.actualizarEstado({ params: { id: "abc" }, body: { nuevoEstado: "Pagado" } }, res, assert.fail);

  assert.equal(res.statusCode, 400);
  assert.equal(llamadas.length, 0);
});

test("actualizarEstado de una orden pasa el id como número", async () => {
  const res = crearRes();

  await ordenController.actualizarEstado({ params: { id: "12" }, body: { nuevoEstado: "Pagado" } }, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(llamadas[0].actualizarEstado, [12, "Pagado"]);
});

test("sin body, las órdenes y el carrito responden 400 en lugar de romper", async () => {
  const peticion = { usuario: { id: 1 }, params: {} };

  const orden = crearRes();
  await ordenController.crearOrden({ ...peticion }, orden, assert.fail);
  const estado = crearRes();
  await ordenController.actualizarEstado({ ...peticion, params: { id: "3" } }, estado, assert.fail);
  const agregar = crearRes();
  await carritoController.agregarProducto({ ...peticion }, agregar, assert.fail);
  const restar = crearRes();
  await carritoController.restarProducto({ ...peticion }, restar, assert.fail);

  for (const res of [orden, estado, agregar, restar]) {
    assert.equal(res.statusCode, 400);
    assert.doesNotMatch(res.body.error, /destructure|undefined|Cannot/);
  }
});

test("modificarPerfil sin body no rompe", async () => {
  filas = [{ id: 1, nombre: "Ana", password_hash: "x" }];

  const perfil = await usuarioService.modificarPerfil(1, undefined);

  assert.equal(perfil.nombre, "Ana");
});

let servidor;
let base;

before(async () => {
  const app = cargar("./src/app");
  await new Promise((resolver) => {
    servidor = app.listen(0, resolver);
  });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => new Promise((resolver) => servidor.close(resolver)));

async function pedirAdmin(rol) {
  const token = await jwtUtils.generarJWT(1, "a@b.com", rol);
  return fetch(`${base}/api/v1/metodos-pago/admin`, { headers: { Authorization: `Bearer ${token}` } });
}

test("GET /metodos-pago/admin lista activos e inactivos para un ADMIN", async () => {
  filas = [
    { id: 1, nombre: "Efectivo", activo: true },
    { id: 2, nombre: "Transferencia", activo: false },
  ];

  const respuesta = await pedirAdmin("ADMIN");

  assert.equal(respuesta.status, 200);
  assert.deepEqual(
    (await respuesta.json()).map((m) => m.activo),
    [true, false],
  );
  assert.doesNotMatch(consultas[0].sql, /WHERE/);
});

test("GET /metodos-pago/admin responde 403 a un CLIENTE y 401 sin token", async () => {
  assert.equal((await pedirAdmin("CLIENTE")).status, 403);
  assert.equal((await fetch(`${base}/api/v1/metodos-pago/admin`)).status, 401);
});

test("GET /metodos-pago/:id con un id inválido responde 400 (la ruta /admin no lo captura)", async () => {
  const token = await jwtUtils.generarJWT(1, "a@b.com", "CLIENTE");
  const respuesta = await fetch(`${base}/api/v1/metodos-pago/abc`, { headers: { Authorization: `Bearer ${token}` } });

  assert.equal(respuesta.status, 400);
});
