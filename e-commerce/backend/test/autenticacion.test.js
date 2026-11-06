const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { cargar, crearRes } = require("./helpers");

process.env.JWT_SECRET = "clave-de-prueba-autenticacion";

const { verificarToken } = cargar("./src/middlewares/autenticacionMiddleware");

function ejecutar(cabecera) {
  const res = crearRes();
  let siguio = false;
  const req = { headers: cabecera ? { authorization: cabecera } : {} };
  verificarToken(req, res, () => {
    siguio = true;
  });
  return { req, res, siguio };
}

test("verificarToken sin token responde 401 { error }", () => {
  const { res, siguio } = ejecutar();

  assert.equal(siguio, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Acceso no autorizado" });
});

test("verificarToken con un token alterado responde 401 { error }", () => {
  const { res, siguio } = ejecutar("Bearer esto.no.es-un-jwt");

  assert.equal(siguio, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Token inválido o expirado." });
});

test("verificarToken con un token vencido responde 401 { error }", () => {
  const vencido = jwt.sign({ id: 1, rol: "CLIENTE" }, process.env.JWT_SECRET, { expiresIn: -10 });
  const { res, siguio } = ejecutar(`Bearer ${vencido}`);

  assert.equal(siguio, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Token inválido o expirado." });
});

test("verificarToken con un token válido carga req.usuario y continúa", () => {
  const token = jwt.sign({ id: 7, rol: "ADMIN" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const { req, siguio } = ejecutar(`Bearer ${token}`);

  assert.equal(siguio, true);
  assert.deepEqual(req.usuario, { id: 7, rol: "ADMIN" });
});
