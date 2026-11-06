const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar } = require("./helpers");

const consultas = [];
let filas = [];

mockModule("./src/config/db", {
  async query(sql, params) {
    consultas.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
    return { rows: filas };
  },
});

const UsuarioModel = cargar("./src/models/UsuarioModel");

beforeEach(() => {
  consultas.length = 0;
  filas = [];
});

test("existeEmail compara sin distinguir mayúsculas y devuelve true si hay fila", async () => {
  filas = [{ "?column?": 1 }];

  const existe = await UsuarioModel.existeEmail("ana@mail.com");

  assert.equal(existe, true);
  assert.match(consultas[0].sql, /LOWER\(email\) = LOWER\(\$1\)/);
  assert.deepEqual(consultas[0].params, ["ana@mail.com"]);
});

test("existeEmail devuelve false si no hay fila", async () => {
  assert.equal(await UsuarioModel.existeEmail("ana@mail.com"), false);
});

test("existeEmail con excluirId deja afuera al propio usuario", async () => {
  await UsuarioModel.existeEmail("ana@mail.com", 7);

  assert.match(consultas[0].sql, /LOWER\(email\) = LOWER\(\$1\) AND id <> \$2/);
  assert.deepEqual(consultas[0].params, ["ana@mail.com", 7]);
});

test("getUsuarioBy('email') compara con LOWER para que entren los usuarios viejos con mayúsculas", async () => {
  await UsuarioModel.getUsuarioBy("email", "Ana@Mail.com");

  assert.match(consultas[0].sql, /WHERE LOWER\(email\) = LOWER\(\$1\)/);
  assert.deepEqual(consultas[0].params, ["Ana@Mail.com"]);
});

test("getUsuarioBy('id') sigue comparando la columna tal cual", async () => {
  await UsuarioModel.getUsuarioBy("id", 3);

  assert.match(consultas[0].sql, /WHERE id = \$1$/);
});

test("getUsuarioBy rechaza 'username', que no existe en el esquema", async () => {
  await assert.rejects(UsuarioModel.getUsuarioBy("username", "ana"), /no permitido/);
  assert.equal(consultas.length, 0);
});
