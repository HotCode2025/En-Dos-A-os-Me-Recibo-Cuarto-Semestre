const UsuarioModel = require('../models/UsuarioModel');

const usuarioService = {
  async getUsuarios() {
    // Aquí se podría agregar lógica de negocio si la necesitamos (ej. transformar datos, filtrar, etc.)
    const usuarios = await UsuarioModel.getAllUsuarios();
    return usuarios;
  },

  async postUsuario(datosUsuario) {

    // Lógica de negocio (ejemplo: validar que vengan datos obligatorios)
    
    /*if (!datosUsuario.email || !datosUsuario.nombre) {
      throw new Error('El nombre y el email son obligatorios');
    }*/

    // Llamada al modelo para guardar en BD
    const nuevoUsuario = await UsuarioModel.postUsuario(datosUsuario);
    return nuevoUsuario;
  }

};

module.exports = usuarioService;