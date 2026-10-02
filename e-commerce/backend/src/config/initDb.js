const pool = require("./db");

const requiredColumns = {
  usuario: [
    "id", "nombre", "apellido", "email", "password_hash", "telefono",
    "fecha_registro", "rol", "calle_numero", "ciudad", "codigo_postal", "pais",
  ],
  categorias: ["id", "nombre", "descripcion", "imagen_url"],
  marca: ["id", "nombre", "logo_url"],
  producto: [
    "id", "nombre", "descripcion", "precio", "puntuacion_promedio",
    "es_destacado", "id_marca", "id_categoria", "fecha_creacion", "stock", "imagen_url",
  ],
  carrito: ["id", "id_usuario", "fecha_creacion"],
  item_carrito: ["id", "id_carrito", "cantidad", "id_producto"],
  direccion: [
    "id", "id_usuario", "calle_numero", "ciudad", "codigo_postal", "pais", "es_principal",
  ],
  metodo_pago: ["id", "nombre", "descripcion", "instrucciones", "activo"],
  orden: [
    "id", "id_usuario", "id_direccion_envio", "id_metodo_pago",
    "fecha_pedido", "estado", "total",
  ],
  detalle_orden: ["id", "id_orden", "cantidad", "precio_unitario", "id_producto"],
  valoracion: ["id", "id_usuario", "id_producto", "calificacion", "comentario", "fecha"],
};

async function verificarEsquema() {
  const result = await pool.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
  `);
  const actualColumns = new Map();
  for (const row of result.rows) {
    if (!actualColumns.has(row.table_name)) actualColumns.set(row.table_name, new Set());
    actualColumns.get(row.table_name).add(row.column_name);
  }

  const missing = [];
  for (const [table, columns] of Object.entries(requiredColumns)) {
    const actual = actualColumns.get(table);
    if (!actual) {
      missing.push(`Falta la tabla ${table}`);
      continue;
    }
    for (const column of columns) {
      if (!actual.has(column)) missing.push(`Falta la columna ${table}.${column}`);
    }
  }

  if (missing.length) {
    throw new Error(`El esquema de la base de datos no coincide con el ERD:\n- ${missing.join("\n- ")}`);
  }
  console.log("El esquema de PostgreSQL coincide con el ERD esperado.");
}

if (require.main === module) {
  verificarEsquema()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { verificarEsquema };
