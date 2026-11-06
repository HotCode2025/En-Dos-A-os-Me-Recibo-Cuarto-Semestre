const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar, crearRes } = require("./helpers");

mockModule("./src/config/db", {});
const HttpError = cargar("./src/utils/httpError");
const { responderError } = cargar("./src/utils/responderError");

test("un HttpError responde con su status y su mensaje", () => {
  const res = crearRes();
  responderError(new HttpError(404, "No existe"), res, assert.fail);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "No existe" });
});

test("un error de negocio común responde con el status por defecto", () => {
  const res = crearRes();
  responderError(new Error("No hay stock suficiente"), res, assert.fail, 409);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { error: "No hay stock suficiente" });
});

test("un error de pg se delega a next sin responder", () => {
  const res = crearRes();
  const err = Object.assign(new Error("relation does not exist"), { code: "42P01" });
  let delegado;
  responderError(err, res, (e) => {
    delegado = e;
  });

  assert.equal(delegado, err);
  assert.equal(res.body, undefined);
});

test("un rechazo que no es Error se delega a next", () => {
  const res = crearRes();
  let delegado;
  responderError("no se puede generar el JWT", res, (e) => {
    delegado = e;
  });

  assert.equal(delegado, "no se puede generar el JWT");
  assert.equal(res.body, undefined);
});

test("el carrito delega los errores de pg en lugar de responderlos como 400", async () => {
  mockModule("./src/services/carritoService", {
    async getCarritoByUsuario() {
      throw Object.assign(new Error('column "x" does not exist'), { code: "42703" });
    },
  });
  const carritoController = cargar("./src/controllers/carritoController");
  const res = crearRes();
  let delegado;

  await carritoController.getMiCarrito({ usuario: { id: 1 } }, res, (e) => {
    delegado = e;
  });

  assert.equal(delegado.code, "42703");
  assert.equal(res.body, undefined);
});
