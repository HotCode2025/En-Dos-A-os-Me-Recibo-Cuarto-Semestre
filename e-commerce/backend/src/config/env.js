// Variables sin las cuales el servidor no puede funcionar de forma segura.
const VARIABLES_OBLIGATORIAS = ["DATABASE_URL", "JWT_SECRET"];

function validarEntorno(env = process.env) {
  const faltantes = VARIABLES_OBLIGATORIAS.filter((nombre) => !env[nombre]);
  if (faltantes.length) {
    throw new Error(`Faltan variables de entorno obligatorias: ${faltantes.join(", ")}`);
  }

  if (env.STOCK_AL_PAGAR_DESDE && Number.isNaN(new Date(env.STOCK_AL_PAGAR_DESDE).getTime())) {
    throw new Error(
      "STOCK_AL_PAGAR_DESDE no es una fecha válida (usar formato ISO, por ejemplo 2026-11-06)",
    );
  }
}

module.exports = { validarEntorno };
