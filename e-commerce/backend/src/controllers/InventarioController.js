const inventarioService = require("../services/inventarioService");

// Controller liviano: delega en el servicio y deja los errores al errorHandler global.
const inventarioController = {
  async getAll(req, res) {
    res.status(200).json(await inventarioService.listar());
  },

  async getById(req, res) {
    res.status(200).json(await inventarioService.obtener(req.params.id));
  },

  async updateStock(req, res) {
    const resultado = await inventarioService.actualizarStock(req.params.id, req.body?.stock);
    res.status(200).json(resultado);
  },
};

module.exports = inventarioController;
