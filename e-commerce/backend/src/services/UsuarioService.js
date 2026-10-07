const UsuarioModel = require('../models/UsuarioModel');
const password = require('../utils/passwordHasd');


const usuarioService = {
  //Método para mostrar todos los usuarios
  async getUsuarios() {
    return UsuarioModel.getAllUsuarios();
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
    //eliminamos rol y fecha_registro, por si vienen en la petición, ya que son datos que no se pueden modficar. 
    const { rol, fecha_registro, ...actualizarUsuario } = datosNuevos;
    const usuarioActualizado = await UsuarioModel.update(usuarioId, actualizarUsuario);
    // Omitimos información sensible antes de retornarlo
    const { password_hash, ...usuarioModificado } = usuarioActualizado;
    return usuarioModificado;
  }

};

module.exports = usuarioService;