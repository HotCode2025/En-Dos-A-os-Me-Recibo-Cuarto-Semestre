//controlador de usuarios
const usuarioService = require('../services/UsuarioService');

const usuarioController = {
  async getAllUsuarios(req, res) {
    try {
      const usuarios = await usuarioService.getUsuarios();
      res.status(200).json(usuarios);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async postUsuario(req, res) {

    try {
      const datosUsuario = req.body;
      const nuevoUsuario = await usuarioService.postUsuario(datosUsuario);
      res.status(201).json(nuevoUsuario);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

};



module.exports = usuarioController;