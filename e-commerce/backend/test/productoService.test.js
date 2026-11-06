const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar } = require("./helpers");

const llamadas = [];
const modelo = { crear: null, actualizar: null, eliminar: null };

mockModule("./src/config/db", {});
mockModule("./src/models/ProductoModel", {
  async getAll() {
    return [{ id: 1 }];
  },
  async getOptions() {
    return { marcas: [], categorias: [] };
  },
  async create(valor) {
    llamadas.push(["create", valor]);
    if (modelo.crear instanceof Error) throw modelo.crear;
    return { id: 10, ...valor };
  },
  async update(id, valor) {
    llamadas.push(["update", id, valor]);
    if (modelo.actualizar instanceof Error) throw modelo.actualizar;
    return modelo.actualizar;
  },
  async delete(id) {
    llamadas.push(["delete", id]);
    if (modelo.eliminar instanceof Error) throw modelo.eliminar;
    return modelo.eliminar;
  },
});

const HttpError = cargar("./src/utils/httpError");
const productoService = cargar("./src/services/productoService");

const valido = { nombre: " Mouse ", precio: "1500", id_marca: 1, id_categoria: 2 };

function errorPg(code) {
  return Object.assign(new Error("detalle interno de pg"), { code });
}

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
  modelo.crear = null;
  modelo.actualizar = { id: 1 };
  modelo.eliminar = { id: 1 };
});

test("crear valida y normaliza el producto antes de guardarlo", async () => {
  const creado = await productoService.crear(valido);

  const [, guardado] = llamadas[0];
  assert.equal(guardado.nombre, "Mouse");
  assert.equal(guardado.precio, 1500);
  assert.equal(guardado.stock, 0);
  assert.equal(guardado.puntuacion_promedio, 0);
  assert.equal(creado.id, 10);
});

test("crear rechaza un producto inválido con HttpError 400 sin tocar el modelo", async () => {
  await assert.rejects(productoService.crear({ ...valido, nombre: "  " }), esHttpError(400, /nombre/));
  await assert.rejects(productoService.crear({ ...valido, precio: -1 }), esHttpError(400, /precio/));
  await assert.rejects(productoService.crear({ ...valido, id_marca: 1.5 }), esHttpError(400, /id_marca/));
  await assert.rejects(productoService.crear({ ...valido, es_destacado: "si" }), esHttpError(400, /es_destacado/));
  assert.equal(llamadas.length, 0);
});

test("crear traduce la violación de clave foránea (23503) en un 400 de marca/categoría", async () => {
  modelo.crear = errorPg("23503");

  await assert.rejects(productoService.crear(valido), esHttpError(400, /marca y categoría/));
});

test("crear no oculta errores que no son de clave foránea", async () => {
  modelo.crear = errorPg("42P01");

  await assert.rejects(productoService.crear(valido), (e) => e.code === "42P01");
});

test("actualizar rechaza un ID inválido con 400", async () => {
  for (const id of ["abc", "0", "-1", "1.5"]) {
    await assert.rejects(productoService.actualizar(id, { nombre: "x" }), esHttpError(400, /ID de producto/));
  }
  assert.equal(llamadas.length, 0);
});

test("actualizar rechaza un body vacío con 400", async () => {
  await assert.rejects(productoService.actualizar("1", {}), esHttpError(400, /campos para actualizar/));
});

test("actualizar de un producto inexistente lanza 404", async () => {
  modelo.actualizar = null;

  await assert.rejects(productoService.actualizar("5", { nombre: "x" }), esHttpError(404));
});

test("actualizar devuelve el producto actualizado con el ID numérico", async () => {
  modelo.actualizar = { id: 5, nombre: "x" };

  const resultado = await productoService.actualizar("5", { nombre: "x" });

  assert.deepEqual(llamadas[0], ["update", 5, { nombre: "x" }]);
  assert.equal(resultado.id, 5);
});

test("eliminar rechaza un ID inválido con 400", async () => {
  await assert.rejects(productoService.eliminar("abc"), esHttpError(400, /ID de producto/));
});

test("eliminar de un producto inexistente lanza 404", async () => {
  modelo.eliminar = null;

  await assert.rejects(productoService.eliminar("9"), esHttpError(404));
});

test("eliminar responde 409 solo ante la violación de clave foránea (23503)", async () => {
  modelo.eliminar = errorPg("23503");

  await assert.rejects(productoService.eliminar("1"), esHttpError(409, /referencias/));
});

test("eliminar no convierte en 409 otros errores", async () => {
  modelo.eliminar = errorPg("57014");

  await assert.rejects(productoService.eliminar("1"), (e) => e.code === "57014" && !(e instanceof HttpError));
});

test("eliminar devuelve el ID borrado", async () => {
  modelo.eliminar = { id: 3 };

  assert.deepEqual(await productoService.eliminar("3"), { id: 3 });
});
