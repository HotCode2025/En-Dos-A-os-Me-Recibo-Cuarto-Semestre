const productoModel = require("../models/ProductoModel");

const productoController = {
  async getAll(req, res) {
    try {
      const productos = await productoModel.getAll();
      res.status(200).json(productos);
    } catch (error) {
      console.error("Error al consultar el catálogo:", error);
      res.status(500).json({
        error:
          "No se pudo cargar el catálogo. Verificá DATABASE_URL y las tablas producto, marca, categorias y valoracion.",
      });
    }
  },

  async getOptions(req, res) {
    try {
      const options = await productoModel.getOptions();
      res.status(200).json(options);
    } catch (error) {
      console.error("Error al consultar marcas y categorías:", error);
      res.status(500).json({ error: "No se pudieron cargar marcas y categorías." });
    }
  },

  async create(req, res) {
    const product = validateProduct(req.body, true);
    if (product.error) return res.status(400).json({ error: product.error });

    try {
      const created = await productoModel.create(product.value);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error al crear producto:", error);
      res.status(400).json({ error: "No se pudo crear el producto. Verificá marca y categoría." });
    }
  },

  async update(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "El ID de producto no es válido." });
    }

    const product = validateProduct(req.body, false);
    if (product.error) return res.status(400).json({ error: product.error });

    try {
      const updated = await productoModel.update(id, product.value);
      if (!updated) return res.status(404).json({ error: "Producto no encontrado." });
      res.status(200).json(updated);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      res.status(400).json({ error: "No se pudo actualizar el producto. Verificá marca y categoría." });
    }
  },

  async delete(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "El ID de producto no es válido." });
    }

    try {
      const deleted = await productoModel.delete(id);
      if (!deleted) return res.status(404).json({ error: "Producto no encontrado." });
      res.status(200).json({ id: deleted.id });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      res.status(409).json({
        error: "No se puede eliminar el producto porque tiene referencias en carritos, órdenes o valoraciones.",
      });
    }
  },
};

function validateProduct(body, isCreate) {
  body = body || {};
  const value = {};
  const requiredStrings = ["nombre"];
  const optionalStrings = ["descripcion", "imagen_url"];
  const requiredNumbers = ["precio", "id_marca", "id_categoria"];
  const optionalNumbers = ["stock"];

  for (const field of requiredStrings) {
    if (isCreate || Object.hasOwn(body, field)) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return { error: `El campo ${field} es obligatorio.` };
      }
      value[field] = body[field].trim();
    }
  }

  for (const field of optionalStrings) {
    if (Object.hasOwn(body, field)) {
      if (body[field] !== null && typeof body[field] !== "string") {
        return { error: `El campo ${field} debe ser texto.` };
      }
      value[field] = body[field]?.trim() || null;
    } else if (isCreate) {
      value[field] = null;
    }
  }

  for (const field of requiredNumbers) {
    if (isCreate || Object.hasOwn(body, field)) {
      const number = Number(body[field]);
      if (
        !Number.isFinite(number) ||
        (field === "precio" ? number < 0 : number <= 0 || !Number.isInteger(number))
      ) {
        return { error: `El campo ${field} no tiene un valor válido.` };
      }
      value[field] = number;
    }
  }

  for (const field of optionalNumbers) {
    if (Object.hasOwn(body, field) || isCreate) {
      const number = Object.hasOwn(body, field) ? Number(body[field]) : 0;
      if (!Number.isInteger(number) || number < 0) {
        return { error: `El campo ${field} debe ser un entero mayor o igual a cero.` };
      }
      value[field] = number;
    }
  }

  if (Object.hasOwn(body, "es_destacado") || isCreate) {
    if (Object.hasOwn(body, "es_destacado") && typeof body.es_destacado !== "boolean") {
      return { error: "El campo es_destacado debe ser booleano." };
    }
    value.es_destacado = body.es_destacado ?? false;
  }
  if (isCreate) value.puntuacion_promedio = 0;

  if (!isCreate && Object.keys(value).length === 0) {
    return { error: "No se recibieron campos para actualizar." };
  }
  return { value };
}

module.exports = productoController;
