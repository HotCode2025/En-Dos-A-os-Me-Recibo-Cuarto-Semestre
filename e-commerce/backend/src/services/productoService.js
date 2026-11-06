const productoModel = require("../models/ProductoModel");
const HttpError = require("../utils/httpError");
const { parseId } = require("../utils/parseId");

const MENSAJE_ID = "El ID de producto no es válido.";
// Código de PostgreSQL para violación de clave foránea.
const FK_VIOLADA = "23503";

const productoService = {
  listar() {
    return productoModel.getAll();
  },

  opciones() {
    return productoModel.getOptions();
  },

  async crear(body) {
    const producto = validarProducto(body, true);
    try {
      return await productoModel.create(producto);
    } catch (error) {
      if (error.code === FK_VIOLADA) {
        throw new HttpError(400, "No se pudo crear el producto. Verificá marca y categoría.");
      }
      throw error;
    }
  },

  async actualizar(idCrudo, body) {
    const id = parseId(idCrudo, MENSAJE_ID);
    const producto = validarProducto(body, false);
    let actualizado;
    try {
      actualizado = await productoModel.update(id, producto);
    } catch (error) {
      if (error.code === FK_VIOLADA) {
        throw new HttpError(400, "No se pudo actualizar el producto. Verificá marca y categoría.");
      }
      throw error;
    }
    if (!actualizado) throw new HttpError(404, "Producto no encontrado.");
    return actualizado;
  },

  async eliminar(idCrudo) {
    const id = parseId(idCrudo, MENSAJE_ID);
    let eliminado;
    try {
      eliminado = await productoModel.delete(id);
    } catch (error) {
      // Solo la violación de clave foránea es un conflicto; el resto es un error inesperado.
      if (error.code === FK_VIOLADA) {
        throw new HttpError(
          409,
          "No se puede eliminar el producto porque tiene referencias en carritos, órdenes o valoraciones.",
        );
      }
      throw error;
    }
    if (!eliminado) throw new HttpError(404, "Producto no encontrado.");
    return { id: eliminado.id };
  },
};

// Valida y normaliza el body de un producto. En creación exige todos los obligatorios;
// en actualización solo valida los campos que llegan. Lanza HttpError 400 ante el primer problema.
function validarProducto(body, esCreacion) {
  body = body || {};
  const valor = {};
  const cadenasObligatorias = ["nombre"];
  const cadenasOpcionales = ["descripcion", "imagen_url"];
  const numerosObligatorios = ["precio", "id_marca", "id_categoria"];
  const numerosOpcionales = ["stock"];
  const invalido = (mensaje) => new HttpError(400, mensaje);

  for (const campo of cadenasObligatorias) {
    if (esCreacion || Object.hasOwn(body, campo)) {
      if (typeof body[campo] !== "string" || !body[campo].trim()) {
        throw invalido(`El campo ${campo} es obligatorio.`);
      }
      valor[campo] = body[campo].trim();
    }
  }

  for (const campo of cadenasOpcionales) {
    if (Object.hasOwn(body, campo)) {
      if (body[campo] !== null && typeof body[campo] !== "string") {
        throw invalido(`El campo ${campo} debe ser texto.`);
      }
      valor[campo] = body[campo]?.trim() || null;
    } else if (esCreacion) {
      valor[campo] = null;
    }
  }

  for (const campo of numerosObligatorios) {
    if (esCreacion || Object.hasOwn(body, campo)) {
      const numero = Number(body[campo]);
      if (
        !Number.isFinite(numero) ||
        (campo === "precio" ? numero < 0 : numero <= 0 || !Number.isInteger(numero))
      ) {
        throw invalido(`El campo ${campo} no tiene un valor válido.`);
      }
      valor[campo] = numero;
    }
  }

  for (const campo of numerosOpcionales) {
    if (Object.hasOwn(body, campo) || esCreacion) {
      const numero = Object.hasOwn(body, campo) ? Number(body[campo]) : 0;
      if (!Number.isInteger(numero) || numero < 0) {
        throw invalido(`El campo ${campo} debe ser un entero mayor o igual a cero.`);
      }
      valor[campo] = numero;
    }
  }

  if (Object.hasOwn(body, "es_destacado") || esCreacion) {
    if (Object.hasOwn(body, "es_destacado") && typeof body.es_destacado !== "boolean") {
      throw invalido("El campo es_destacado debe ser booleano.");
    }
    valor.es_destacado = body.es_destacado ?? false;
  }
  if (esCreacion) valor.puntuacion_promedio = 0;

  if (!esCreacion && Object.keys(valor).length === 0) {
    throw invalido("No se recibieron campos para actualizar.");
  }
  return valor;
}

module.exports = productoService;
