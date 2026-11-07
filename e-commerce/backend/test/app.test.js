const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar } = require("./helpers");

mockModule("./src/config/db", { query: async () => ({ rows: [] }) });

process.env.JWT_SECRET = process.env.JWT_SECRET || "clave-de-prueba-app";

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

test("una ruta inexistente responde 404 JSON", async () => {
  const respuesta = await fetch(`${base}/api/v1/no-existe`);

  assert.equal(respuesta.status, 404);
  assert.deepEqual(await respuesta.json(), { error: "Ruta no encontrada." });
});

test("/api/v1/carrito sin token responde 401", async () => {
  const respuesta = await fetch(`${base}/api/v1/carrito`);

  assert.equal(respuesta.status, 401);
});

test("/api/v1/ordenes y /api/v1/metodos-pago siguen montados y protegidos", async () => {
  for (const ruta of ["ordenes", "metodos-pago/1"]) {
    const respuesta = await fetch(`${base}/api/v1/${ruta}`);
    assert.equal(respuesta.status, 401, ruta);
  }
});

test("un JSON mal formado responde 400 JSON", async () => {
  const respuesta = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{no es json",
  });

  assert.equal(respuesta.status, 400);
  assert.deepEqual(await respuesta.json(), { error: "El cuerpo de la petición no es un JSON válido." });
});

test("CORS responde al front de Netlify y no a un origen ajeno", async () => {
  const permitido = await fetch(`${base}/`, { headers: { Origin: "https://puntozeroecommerce.netlify.app" } });
  assert.equal(permitido.headers.get("access-control-allow-origin"), "https://puntozeroecommerce.netlify.app");

  const ajeno = await fetch(`${base}/`, { headers: { Origin: "https://evil.example" } });
  assert.equal(ajeno.headers.get("access-control-allow-origin"), null);
});
