const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar } = require("./helpers");

const llamadas = [];
const modelo = { producto: null };

mockModule("./src/config/db", {});
mockModule("./src/models/InventarioModel", {
  async getAll() {
    return [{ id: 1 }];
  },
  async getById(id) {
    llamadas.push(["getById", id]);
    return modelo.producto;
  },
  async updateStock(id, stock) {
    llamadas.push(["updateStock", id, stock]);
    return modelo.producto;
  },
});

const HttpError = cargar("./src/utils/httpError");
const { parseId } = cargar("./src/utils/parseId");
const inventarioService = cargar("./src/services/inventarioService");

function esHttpError(status, mensaje) {
  return (e) => {
    assert.ok(e instanceof HttpError, `se esperaba HttpError y llegó ${e}`);
    assert.equal(e.status, status);
    if (mensaje) assert.match(e.message, mensaje);
    return true;
  };
}

beforeEach(() => {
  llamadas.length = 0;
  modelo.producto = { id: 1, nombre: "Mouse", stock: 4 };
});

test("parseId devuelve el entero positivo", () => {
  assert.equal(parseId("12", "ID inválido"), 12);
  assert.equal(parseId(3, "ID inválido"), 3);
});

test("parseId lanza HttpError 400 con el mensaje dado ante valores inválidos", () => {
  for (const valor of ["abc", "0", "-4", "1.5", "", undefined, null]) {
    assert.throws(() => parseId(valor, "ID inválido"), esHttpError(400, /^ID inválido$/));
  }
});

test("obtener rechaza un ID inválido con 400 sin consultar el modelo", async () => {
  await assert.rejects(inventarioService.obtener("x"), esHttpError(400, /entero positivo/));
  assert.equal(llamadas.length, 0);
});

test("obtener de un producto inexistente lanza 404", async () => {
  modelo.producto = null;

  await assert.rejects(inventarioService.obtener("7"), esHttpError(404));
});

test("obtener devuelve el producto", async () => {
  assert.deepEqual(await inventarioService.obtener("1"), { id: 1, nombre: "Mouse", stock: 4 });
});

test("actualizarStock exige un entero mayor o igual a cero", async () => {
  for (const stock of [-1, 1.5, "3", null, undefined, NaN]) {
    await assert.rejects(inventarioService.actualizarStock("1", stock), esHttpError(400, /stock/));
  }
  assert.equal(llamadas.length, 0);
});

test("actualizarStock acepta cero", async () => {
  await inventarioService.actualizarStock("1", 0);

  assert.deepEqual(llamadas[0], ["updateStock", 1, 0]);
});

test("actualizarStock valida el ID antes que el stock", async () => {
  await assert.rejects(inventarioService.actualizarStock("abc", -5), esHttpError(400, /ID/));
});

test("actualizarStock de un producto inexistente lanza 404", async () => {
  modelo.producto = null;

  await assert.rejects(inventarioService.actualizarStock("9", 3), esHttpError(404));
});

test("actualizarStock devuelve el mensaje y el producto", async () => {
  modelo.producto = { id: 1, nombre: "Mouse", stock: 8 };

  const resultado = await inventarioService.actualizarStock("1", 8);

  assert.deepEqual(resultado, {
    mensaje: "Stock actualizado correctamente.",
    producto: { id: 1, nombre: "Mouse", stock: 8 },
  });
});
