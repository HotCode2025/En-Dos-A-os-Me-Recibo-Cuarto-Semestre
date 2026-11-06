const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { cargar, crearRes } = require("./helpers");

function ejecutar(err, extra = {}) {
  const { errorHandler } = cargar("./src/middlewares/errorHandler");
  const res = crearRes();
  res.headersSent = extra.headersSent || false;
  let siguioConError;
  errorHandler(err, {}, res, (e) => {
    siguioConError = e;
  });
  return { res, siguioConError };
}

test("HttpError responde con su propio status y mensaje", () => {
  const HttpError = cargar("./src/utils/httpError");
  const { res } = ejecutar(new HttpError(404, "Producto no encontrado."));

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Producto no encontrado." });
});

test("HttpError con code lo incluye en el cuerpo", () => {
  const HttpError = cargar("./src/utils/httpError");
  const err = new HttpError(409, "Conflicto");
  err.code = "STOCK_INSUFICIENTE";
  const { res } = ejecutar(err);

  assert.deepEqual(res.body, { error: "Conflicto", code: "STOCK_INSUFICIENTE" });
});

test("pg 23505 (unique) responde 409 sin exponer el mensaje crudo", () => {
  const err = Object.assign(new Error('duplicate key value violates unique constraint "usuario_email_key"'), {
    code: "23505",
  });
  const { res } = ejecutar(err);

  assert.equal(res.statusCode, 409);
  assert.ok(!JSON.stringify(res.body).includes("usuario_email_key"));
  assert.equal(typeof res.body.error, "string");
});

test("pg 23503 (foreign key) responde 409 sin exponer el mensaje crudo", () => {
  const err = Object.assign(new Error('violates foreign key constraint "fk_detalle"'), { code: "23503" });
  const { res } = ejecutar(err);

  assert.equal(res.statusCode, 409);
  assert.ok(!JSON.stringify(res.body).includes("fk_detalle"));
});

test("JSON mal formado (entity.parse.failed) responde 400", () => {
  const err = Object.assign(new SyntaxError("Unexpected token"), { type: "entity.parse.failed", status: 400 });
  const { res } = ejecutar(err);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "El cuerpo de la petición no es un JSON válido." });
});

test("cualquier otro error responde 500 genérico y se registra en el log", () => {
  const log = mock.method(console, "error", () => {});
  try {
    const { res } = ejecutar(new Error('relation "orden" does not exist'));

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: "Error interno del servidor." });
    assert.equal(log.mock.callCount(), 1);
  } finally {
    log.mock.restore();
  }
});

test("un rechazo que no es Error (string) también responde 500 genérico", () => {
  const log = mock.method(console, "error", () => {});
  try {
    const { res } = ejecutar("no se puede generar el JWT");

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: "Error interno del servidor." });
  } finally {
    log.mock.restore();
  }
});

test("si la respuesta ya empezó a enviarse delega en el handler por defecto de Express", () => {
  const err = new Error("tarde");
  const { res, siguioConError } = ejecutar(err, { headersSent: true });

  assert.equal(siguioConError, err);
  assert.equal(res.body, undefined);
});

test("noEncontrado responde 404 JSON", () => {
  const { noEncontrado } = cargar("./src/middlewares/errorHandler");
  const res = crearRes();
  noEncontrado({ method: "GET", originalUrl: "/api/v1/nada" }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Ruta no encontrada." });
});
