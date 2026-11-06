const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { mockModule, cargar, crearRes } = require("./helpers");

process.env.JWT_SECRET = "clave-de-prueba-auth";

const modelo = { usuarioPorBusqueda: null, falloAlGuardar: null, falloAlActualizar: null };

mockModule("./src/config/db", {});
mockModule("./src/models/UsuarioModel", {
  async existeEmail() {
    return false;
  },
  async getUsuarioBy() {
    return modelo.usuarioPorBusqueda;
  },
  async postUsuario(datos) {
    if (modelo.falloAlGuardar) throw modelo.falloAlGuardar;
    return { id: 1, ...datos, password_hash: "x" };
  },
  async getAllUsuarios() {
    if (modelo.falloAlGuardar) throw modelo.falloAlGuardar;
    return [];
  },
  async update() {
    throw modelo.falloAlActualizar;
  },
});

const HttpError = cargar("./src/utils/httpError");
const authService = cargar("./src/services/authService");
const authController = cargar("./src/controllers/authController");
const usuarioService = cargar("./src/services/UsuarioService");
const usuarioController = cargar("./src/controllers/UsuarioController");

function errorPg(mensaje, code) {
  return Object.assign(new Error(mensaje), { code });
}

beforeEach(() => {
  modelo.usuarioPorBusqueda = null;
  modelo.falloAlGuardar = null;
  modelo.falloAlActualizar = null;
});

test("login con un email inexistente lanza HttpError 401", async () => {
  await assert.rejects(authService.loginUsuario({ email: "a@b.com", password: "x" }), (e) => {
    assert.ok(e instanceof HttpError);
    assert.equal(e.status, 401);
    assert.equal(e.message, "Credenciales incorrectas");
    return true;
  });
});

test("login con la contraseña equivocada lanza HttpError 401", async () => {
  modelo.usuarioPorBusqueda = { id: 1, email: "a@b.com", rol: "CLIENTE", password_hash: bcrypt.hashSync("buena", 4) };

  await assert.rejects(authService.loginUsuario({ email: "a@b.com", password: "mala" }), (e) => {
    assert.ok(e instanceof HttpError);
    assert.equal(e.status, 401);
    return true;
  });
});

test("el login exitoso responde 200 con token y usuario sin password_hash", async () => {
  modelo.usuarioPorBusqueda = { id: 1, email: "a@b.com", rol: "CLIENTE", password_hash: bcrypt.hashSync("buena", 4) };
  const res = crearRes();

  await authController.loginUsuario({ body: { email: "a@b.com", password: "buena" } }, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.usuario.password_hash, undefined);
});

test("el login con credenciales inválidas responde 401 { error }", async () => {
  const res = crearRes();

  await authController.loginUsuario({ body: { email: "a@b.com", password: "x" } }, res, assert.fail);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Credenciales incorrectas" });
});

test("el registro con un email duplicado delega el error de pg sin responder el mensaje crudo", async () => {
  modelo.falloAlGuardar = errorPg('duplicate key value violates unique constraint "usuario_email_key"', "23505");
  const res = crearRes();
  let delegado;

  await authController.registrarUsuario(
    { body: { nombre: "A", apellido: "B", email: "a@b.com", password: "12345", telefono: "1" } },
    res,
    (e) => {
      delegado = e;
    },
  );

  assert.equal(delegado.code, "23505");
  assert.equal(res.body, undefined);
});

test("el registro exitoso responde 201", async () => {
  const res = crearRes();

  await authController.registrarUsuario(
    { body: { nombre: "A", apellido: "B", email: "a@b.com", password: "12345", telefono: "1" } },
    res,
    assert.fail,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.rol, "CLIENTE");
});

test("getAllUsuarios no expone mensajes de pg: delega con next", async () => {
  modelo.falloAlGuardar = errorPg('relation "usuario" does not exist', "42P01");
  const res = crearRes();
  let delegado;

  await usuarioController.getAllUsuarios({}, res, (e) => {
    delegado = e;
  });

  assert.equal(delegado.code, "42P01");
  assert.equal(res.body, undefined);
});

test("getPerfil de un usuario inexistente lanza HttpError 404", async () => {
  await assert.rejects(usuarioService.getPerfil(99), (e) => {
    assert.ok(e instanceof HttpError);
    assert.equal(e.status, 404);
    return true;
  });
});

test("modificarPerfil no expone mensajes de pg: delega con next", async () => {
  modelo.falloAlActualizar = errorPg("invalid input syntax for type integer", "22P02");
  const res = crearRes();
  let delegado;

  await usuarioController.modificarPerfil({ usuario: { id: 1 }, body: { telefono: "x" } }, res, (e) => {
    delegado = e;
  });

  assert.equal(delegado.code, "22P02");
  assert.equal(res.body, undefined);
});
