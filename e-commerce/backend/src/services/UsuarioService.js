const UsuarioModel = require('../models/UsuarioModel');
const password = require('../utils/passwordHasd');


const usuarioService = {
  async getUsuarios() {
    // Aquí se podría agregar lógica de negocio si la necesitamos (ej. transformar datos, filtrar, etc.)
    const usuarios = await UsuarioModel.getAllUsuarios();
    return usuarios;
  },

};

module.exports = usuarioService;