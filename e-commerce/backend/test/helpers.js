const path = require("node:path");

const raiz = path.join(__dirname, "..");

// Replaces a module in the require cache so the code under test never touches the real DB or Mercado Pago.
function mockModule(modulo, exportsFalsos) {
  const resuelto = modulo.startsWith(".")
    ? require.resolve(path.join(raiz, modulo))
    : require.resolve(modulo, { paths: [raiz] });
  require.cache[resuelto] = {
    id: resuelto,
    filename: resuelto,
    loaded: true,
    exports: exportsFalsos,
  };
}

function cargar(modulo) {
  const resuelto = require.resolve(path.join(raiz, modulo));
  delete require.cache[resuelto];
  return require(resuelto);
}

function crearRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(cuerpo) {
      this.body = cuerpo;
      return this;
    },
    sendStatus(codigo) {
      this.statusCode = codigo;
      return this;
    },
  };
}

// Fake pg client that records queries and answers through a handler.
function crearClienteFalso(responder) {
  const consultas = [];
  return {
    consultas,
    liberado: false,
    async query(sql, params = []) {
      consultas.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
      return (await responder(sql, params)) || { rows: [] };
    },
    release() {
      this.liberado = true;
    },
  };
}

// Ejecuta una cadena de middlewares (por ejemplo, reglas de express-validator) hasta que uno no llame a next().
async function ejecutarCadena(middlewares, req) {
  const res = crearRes();
  for (const middleware of middlewares) {
    let siguio = false;
    await middleware(req, res, () => {
      siguio = true;
    });
    if (!siguio) return { res, llegoAlFinal: false };
  }
  return { res, llegoAlFinal: true };
}

module.exports = { mockModule, cargar, crearRes, crearClienteFalso, ejecutarCadena };
