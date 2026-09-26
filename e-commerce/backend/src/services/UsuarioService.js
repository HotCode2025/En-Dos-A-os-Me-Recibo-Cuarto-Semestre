const UsuarioModel = require('../models/UsuarioModel');
const password = require('../utils/passwordHasd');


const usuarioService = {
  //Método para mostrar todos los usuarios
  async getUsuarios() {
    const usuarios = await UsuarioModel.getAllUsuarios();
    // Omitimos información sensible antes de retornarlo
    const { password_hash, ...usuarioModificado } = usuarios;
    return usuarioModificado;
  },

  // Obtener la información del perfil
  async getPerfil(usuarioId) {

    const usuario = await UsuarioModel.getUsuarioBy("id", usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Omitimos información sensible antes de retornarlo
    const { password_hash, ...usuarioModificado } = usuario;
    return usuarioModificado;
  },

  // Actualizar datos del perfil
  async modificarPerfil(usuarioId, datosNuevos) {
    const usuarioActualizado = await UsuarioModel.update(usuarioId, datosNuevos);
    // Omitimos información sensible antes de retornarlo
    const { password_hash, ...usuarioModificado } = usuarioActualizado;
    return usuarioModificado;
  }

};

module.exports = usuarioService;