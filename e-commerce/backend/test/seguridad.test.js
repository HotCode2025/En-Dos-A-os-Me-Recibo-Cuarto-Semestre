const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar, crearRes } = require("./helpers");

mockModule("./src/config/db", {});

async function ejecutarCadena(middlewares, req) {
  const res = crearRes();
  let llegoAlFinal = false;
  for (const middleware of middlewares) {
    let siguio = false;
    await middleware(req, res, () => {
      siguio = true;
    });
    if (!siguio) return { res, llegoAlFinal };
  }
  llegoAlFinal = true;
  return { res, llegoAlFinal };
}

test("validarEntorno exige DATABASE_URL y JWT_SECRET", () => {
  const { validarEntorno } = cargar("./src/config/env");

  assert.throws(() => validarEntorno({}), {
    message: "Faltan variables de entorno obligatorias: DATABASE_URL, JWT_SECRET",
  });
  assert.doesNotThrow(() => validarEntorno({ DATABASE_URL: "postgres://x", JWT_SECRET: "s" }));
});

test("jwtUtils no usa una clave por defecto si falta JWT_SECRET", async () => {
  const anterior = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  const jwtUtils = cargar("./src/utils/jwtUtils");

  await assert.rejects(jwtUtils.generarJWT(1, "a@b.com", "CLIENTE"));
  assert.throws(() => jwtUtils.verificarTokenJWT("token"), { message: "JWT_SECRET no está definido" });

  process.env.JWT_SECRET = "clave-de-prueba";
  const token = await jwtUtils.generarJWT(1, "a@b.com", "CLIENTE");
  assert.equal(jwtUtils.verificarTokenJWT(token).rol, "CLIENTE");

  if (anterior === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = anterior;
});

test("la regla de login responde 400 con datos inválidos", async () => {
  const validarUsuario = cargar("./src/middlewares/validarUsuario");

  const { res, llegoAlFinal } = await ejecutarCadena(validarUsuario.login, {
    body: { email: "no-es-email", password: "" },
  });

  assert.equal(llegoAlFinal, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "Datos de entrada inválidos");
});

test("la regla de login deja pasar datos válidos", async () => {
  const validarUsuario = cargar("./src/middlewares/validarUsuario");

  const { llegoAlFinal } = await ejecutarCadena(validarUsuario.login, {
    body: { email: "ana@puntozero.com", password: "secreta" },
  });

  assert.equal(llegoAlFinal, true);
});

test("la regla de registro sigue rechazando datos inválidos", async () => {
  const validarUsuario = cargar("./src/middlewares/validarUsuario");

  const { res, llegoAlFinal } = await ejecutarCadena(validarUsuario.nuevoUsuario, { body: {} });

  assert.equal(llegoAlFinal, false);
  assert.equal(res.statusCode, 400);
});
