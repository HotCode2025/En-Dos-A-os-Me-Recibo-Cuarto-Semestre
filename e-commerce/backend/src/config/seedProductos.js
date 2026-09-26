const pool = require("./db");

const cargarProductos = async () => {
  const querySql = `
    INSERT INTO productos (nombre, descripcion, precio, stock) 
    VALUES 
      ('Creatina Monohidratada Star Nutrition 300g', 'Suplemento deportivo para aumento de fuerza', 45000.00, 50),
      ('Proteína Whey Premium 1kg', 'Proteína de suero de leche sabor chocolate', 68000.00, 30),
      ('Camiseta Titular River Plate', 'Indumentaria oficial atlética Adidas', 125000.00, 15)
    RETURNING *;
  `;

  try {
    console.log("Insertando productos de prueba en el catálogo...");
    const result = await pool.query(querySql);
    console.log("¡Productos cargados con éxito!");
    console.table(result.rows);
  } catch (error) {
    console.error("Error al cargar los productos:", error);
  } finally {
    pool.end();
  }
};

cargarProductos();
