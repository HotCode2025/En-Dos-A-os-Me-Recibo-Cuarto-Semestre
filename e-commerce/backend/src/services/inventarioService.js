const inventarioModel = require("../models/InventarioModel");
const HttpError = require("../utils/httpError");
const { parseId } = require("../utils/parseId");

const MENSAJE_ID = "El ID debe ser un número entero positivo.";

const inventarioService = {
  listar() {
    return inventarioModel.getAll();
  },

  async obtener(idCrudo) {
    const id = parseId(idCrudo, MENSAJE_ID);
    const producto = await inventarioModel.getById(id);
    if (!producto) throw new HttpError(404, "Producto no encontrado.");
    return producto;
  },

  async actualizarStock(idCrudo, stock) {
    const id = parseId(idCrudo, MENSAJE_ID);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new HttpError(400, "El stock debe ser un número entero mayor o igual a cero.");
    }

    const producto = await inventarioModel.updateStock(id, stock);
    if (!producto) throw new HttpError(404, "Producto no encontrado.");
    return { mensaje: "Stock actualizado correctamente.", producto };
  },
};

module.exports = inventarioService;
