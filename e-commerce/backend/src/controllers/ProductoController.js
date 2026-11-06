const productoService = require("../services/productoService");

// Controller liviano: delega en el servicio y deja los errores al errorHandler global.
const productoController = {
  async getAll(req, res) {
    res.status(200).json(await productoService.listar());
  },

  async getOptions(req, res) {
    res.status(200).json(await productoService.opciones());
  },

  async create(req, res) {
    res.status(201).json(await productoService.crear(req.body));
  },

  async update(req, res) {
    res.status(200).json(await productoService.actualizar(req.params.id, req.body));
  },

  async delete(req, res) {
    res.status(200).json(await productoService.eliminar(req.params.id));
  },
};

module.exports = productoController;
