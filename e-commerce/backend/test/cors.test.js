const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./helpers");

const { obtenerOrigenesPermitidos } = cargar("./src/config/cors");

const NETLIFY = "https://puntozeroecommerce.netlify.app";

test("sin configuración permite los orígenes locales y el front publicado en Netlify", () => {
  assert.deepEqual(obtenerOrigenesPermitidos({}), ["http://localhost:5173", "http://localhost:3000", NETLIFY]);
});

test("CORS_ORIGIN acepta una lista separada por comas y normaliza barras finales", () => {
  assert.deepEqual(
    obtenerOrigenesPermitidos({ CORS_ORIGIN: " https://puntozero.app/ ,https://admin.puntozero.app" }),
    ["https://puntozero.app", "https://admin.puntozero.app"],
  );
});

test("FRONTEND_URL se permite siempre, sin duplicados", () => {
  assert.deepEqual(
    obtenerOrigenesPermitidos({ FRONTEND_URL: "https://puntozero.app/", CORS_ORIGIN: "https://puntozero.app" }),
    ["https://puntozero.app"],
  );
  assert.deepEqual(obtenerOrigenesPermitidos({ FRONTEND_URL: "https://puntozero.app" }), [
    "http://localhost:5173",
    "http://localhost:3000",
    NETLIFY,
    "https://puntozero.app",
  ]);
});
