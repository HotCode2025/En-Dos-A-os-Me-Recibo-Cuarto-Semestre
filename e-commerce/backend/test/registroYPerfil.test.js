const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { mockModule, cargar, ejecutarCadena } = require("./helpers");

process.env.JWT_SECRET = "clave-de-prueba-registro";

const modelo = {
  emailOcupado: false,
  consultasExisteEmail: [],
  guardados: [],
  actualizados: [],
  filaActualizada: undefined,
  usuarioPorBusqueda: null,
};

mockModule("./src/config/db", {});
mockModule("./src/models/UsuarioModel", {
  async existeEmail(email, excluirId) {
    modelo.consultasExisteEmail.push({ email, excluirId });
    return modelo.emailOcupado;
  },
  async postUsuario(datos) {
    modelo.guardados.push(datos);
    return { id: 1, ...datos, password_hash: "x" };
  },
  async getUsuarioBy() {
    return modelo.usuarioPorBusqueda;
  },
  async update(id, datos) {
    modelo.actualizados.push({ id, datos });
    return modelo.filaActualizada;
  },
});

const HttpError = cargar("./src/utils/httpError");
const validarUsuario = cargar("./src/middlewares/validarUsuario");
const authService = cargar("./src/services/authService");
const usuarioService = cargar("./src/services/UsuarioService");

const registroValido = {
  nombre: "Ana",
  apellido: "Test",
  email: "Ana.Test@Mail.com",
  password: "12345",
  telefono: "+54 11 1234-5678",
};

beforeEach(() => {
  modelo.emailOcupado = false;
  modelo.consultasExisteEmail = [];
  modelo.guardados = [];
  modelo.actualizados = [];
  modelo.filaActualizada = undefined;
  modelo.usuarioPorBusqueda = null;
});

test("la regla de registro normaliza el email a minúsculas y sin espacios", async () => {
  const req = { body: { ...registroValido, email: "  Ana.Test@Mail.com " } };

  const { llegoAlFinal } = await ejecutarCadena(validarUsuario.nuevoUsuario, req);

  assert.equal(llegoAlFinal, true);
  assert.equal(req.body.email, "ana.test@mail.com");
});

test("la regla de login normaliza el email a minúsculas", async () => {
  const req = { body: { email: " ANA@Mail.com", password: "secreta" } };

  const { llegoAlFinal } = await ejecutarCadena(validarUsuario.login, req);

  assert.equal(llegoAlFinal, true);
  assert.equal(req.body.email, "ana@mail.com");
});

test("la regla de registro acepta +54 11 1234-5678 y lo guarda solo con dígitos y el + inicial", async () => {
  const req = { body: { ...registroValido } };

  const { llegoAlFinal } = await ejecutarCadena(validarUsuario.nuevoUsuario, req);

  assert.equal(llegoAlFinal, true);
  assert.equal(req.body.telefono, "+541112345678");
});

test("la regla de registro rechaza teléfonos con letras, demasiado cortos o sin dígitos suficientes", async () => {
  for (const telefono of ["abc12345", "12345", "------", "11 (2233) 4455", "+54+1112345"]) {
    const { res, llegoAlFinal } = await ejecutarCadena(validarUsuario.nuevoUsuario, {
      body: { ...registroValido, telefono },
    });

    assert.equal(llegoAlFinal, false, telefono);
    assert.equal(res.statusCode, 400, telefono);
  }
});

test("el registro con un email ya existente (con otras mayúsculas) lanza HttpError 409 sin guardar", async () => {
  modelo.emailOcupado = true;

  await assert.rejects(authService.registrarUsuario({ ...registroValido, email: "ANA.TEST@mail.com" }), (e) => {
    assert.ok(e instanceof HttpError);
    assert.equal(e.status, 409);
    assert.equal(e.message, "El email ya está registrado");
    return true;
  });

  assert.deepEqual(modelo.consultasExisteEmail, [{ email: "ana.test@mail.com", excluirId: undefined }]);
  assert.equal(modelo.guardados.length, 0);
});

test("el registro con un email libre guarda el email normalizado y rol CLIENTE", async () => {
  const creado = await authService.registrarUsuario({ ...registroValido });

  assert.equal(modelo.guardados[0].email, "ana.test@mail.com");
  assert.equal(creado.rol, "CLIENTE");
  assert.equal(creado.password_hash, undefined);
});

test("el login normaliza el email antes de buscar al usuario", async () => {
  modelo.usuarioPorBusqueda = {
    id: 1,
    email: "Ana.Test@Mail.com",
    rol: "CLIENTE",
    password_hash: bcrypt.hashSync("buena", 4),
  };

  const { usuario, token } = await authService.loginUsuario({ email: "ANA.TEST@MAIL.COM", password: "buena" });

  assert.equal(usuario.id, 1);
  assert.ok(token);
});

test("el perfil devuelve 409 si el email nuevo ya pertenece a otro usuario", async () => {
  modelo.emailOcupado = true;
  modelo.usuarioPorBusqueda = { id: 7, email: "propio@mail.com" };

  await assert.rejects(usuarioService.modificarPerfil(7, { email: "Otro@Mail.com" }), (e) => {
    assert.ok(e instanceof HttpError);
    assert.equal(e.status, 409);
    assert.equal(e.message, "El email ya está registrado");
    return true;
  });

  assert.deepEqual(modelo.consultasExisteEmail, [{ email: "otro@mail.com", excluirId: 7 }]);
  assert.equal(modelo.actualizados.length, 0);
});

test("el perfil guarda el email normalizado y el teléfono normalizado", async () => {
  modelo.filaActualizada = { id: 7, nombre: "Ana", password_hash: "x" };
  modelo.usuarioPorBusqueda = { id: 7, email: "viejo@mail.com" };

  const perfil = await usuarioService.modificarPerfil(7, {
    email: " Nuevo@Mail.com ",
    telefono: "+54 11 1234-5678",
    rol: "ADMIN",
  });

  assert.deepEqual(modelo.actualizados[0].datos, { email: "nuevo@mail.com", telefono: "+541112345678" });
  assert.equal(perfil.password_hash, undefined);
});

test("el perfil sin cambio de email no consulta duplicados", async () => {
  modelo.filaActualizada = { id: 7, nombre: "Nuevo" };

  await usuarioService.modificarPerfil(7, { nombre: "Nuevo" });

  assert.equal(modelo.consultasExisteEmail.length, 0);
});

test("el perfil con el mismo email no consulta duplicados aunque haya otra fila igual en la base", async () => {
  modelo.emailOcupado = true;
  modelo.usuarioPorBusqueda = { id: 7, email: "ana@mail.com" };
  modelo.filaActualizada = { id: 7, nombre: "Nuevo" };

  const perfil = await usuarioService.modificarPerfil(7, { email: "ana@mail.com", nombre: "Nuevo" });

  assert.equal(perfil.nombre, "Nuevo");
  assert.equal(modelo.consultasExisteEmail.length, 0);
  assert.equal(modelo.actualizados.length, 1);
});

test("el perfil con el mismo email en otras mayúsculas no consulta duplicados", async () => {
  modelo.emailOcupado = true;
  modelo.usuarioPorBusqueda = { id: 7, email: "Ana@Mail.com" };
  modelo.filaActualizada = { id: 7 };

  await usuarioService.modificarPerfil(7, { email: " ANA@mail.COM " });

  assert.equal(modelo.consultasExisteEmail.length, 0);
});

test("el perfil con un email distinto consulta duplicados y devuelve 409 si es ajeno", async () => {
  modelo.emailOcupado = true;
  modelo.usuarioPorBusqueda = { id: 7, email: "ana@mail.com" };

  await assert.rejects(usuarioService.modificarPerfil(7, { email: "otra@mail.com" }), { status: 409 });
  assert.equal(modelo.consultasExisteEmail.length, 1);
});

test("el perfil con email de un usuario inexistente lanza 404", async () => {
  modelo.usuarioPorBusqueda = null;

  await assert.rejects(usuarioService.modificarPerfil(99, { email: "x@mail.com" }), { status: 404 });
  assert.equal(modelo.actualizados.length, 0);
});

test("el perfil de un usuario inexistente lanza HttpError 404 en lugar de romper", async () => {
  modelo.filaActualizada = undefined;

  await assert.rejects(usuarioService.modificarPerfil(99, { nombre: "X" }), (e) => {
    assert.ok(e instanceof HttpError);
    assert.equal(e.status, 404);
    return true;
  });
});

test("la regla de edición de perfil rechaza un email o teléfono inválidos y normaliza los válidos", async () => {
  const invalido = await ejecutarCadena(validarUsuario.editarPerfil, { body: { email: "no-es-email" } });
  assert.equal(invalido.llegoAlFinal, false);
  assert.equal(invalido.res.statusCode, 400);

  const telefonoInvalido = await ejecutarCadena(validarUsuario.editarPerfil, { body: { telefono: "abc" } });
  assert.equal(telefonoInvalido.llegoAlFinal, false);

  const req = { body: { email: " A@B.com ", telefono: "11 2233-4455" } };
  const valido = await ejecutarCadena(validarUsuario.editarPerfil, req);
  assert.equal(valido.llegoAlFinal, true);
  assert.deepEqual(req.body, { email: "a@b.com", telefono: "1122334455" });
});

test("la regla de edición de perfil deja pasar un body vacío", async () => {
  const { llegoAlFinal } = await ejecutarCadena(validarUsuario.editarPerfil, { body: {} });
  assert.equal(llegoAlFinal, true);
});
