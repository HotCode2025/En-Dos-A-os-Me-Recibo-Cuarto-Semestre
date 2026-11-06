const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mockModule, cargar } = require("./helpers");

class PoolFalso {
  constructor() {
    this.escuchas = [];
  }
  on(evento) {
    this.escuchas.push(evento);
  }
}
mockModule("pg", { Pool: PoolFalso });

test("el handler de error del pool solo loguea y no termina el proceso", (t) => {
  const salida = t.mock.method(process, "exit", () => {});
  const log = t.mock.method(console, "error", () => {});
  const pool = cargar("./src/config/db");

  assert.equal(typeof pool.manejarErrorDelPool, "function");
  pool.manejarErrorDelPool(new Error("Connection terminated unexpectedly"));

  assert.equal(salida.mock.callCount(), 0);
  assert.equal(log.mock.callCount(), 1);
});

test("el pool se suscribe solo a error (sin handler connect vacío)", () => {
  const pool = cargar("./src/config/db");
  assert.deepEqual(pool.escuchas, ["error"]);
});
