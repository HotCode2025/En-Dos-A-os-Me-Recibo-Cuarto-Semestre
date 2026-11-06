const UsuarioModel = require('../models/UsuarioModel');
const HttpError = require('../utils/httpError');
const { normalizarEmail, normalizarTelefono } = require('../utils/normalizarContacto');


const usuarioService = {
  //Método para mostrar todos los usuarios
  async getUsuarios() {
    return UsuarioModel.getAllUsuarios();
  },

  // Obtener la información del perfil
  async getPerfil(usuarioId) {

    const usuario = await UsuarioModel.getUsuarioBy("id", usuarioId);
    if (!usuario) {
      throw new HttpError(404, 'Usuario no encontrado');
    }

    // Omitimos información sensible antes de retornarlo
    const { password_hash, ...usuarioModificado } = usuario;
    return usuarioModificado;
  },

  // Actualizar datos del perfil
  async modificarPerfil(usuarioId, datosNuevos) {
    //eliminamos rol y fecha_registro, por si vienen en la petición, ya que son datos que no se pueden modficar. 
    const { rol, fecha_registro, ...actualizarUsuario } = datosNuevos ?? {};

    if (actualizarUsuario.email) {
      actualizarUsuario.email = normalizarEmail(actualizarUsuario.email);
      const usuarioActual = await UsuarioModel.getUsuarioBy("id", usuarioId);
      if (!usuarioActual) {
        throw new HttpError(404, 'Usuario no encontrado');
      }
      // Sin UNIQUE en la tabla: solo se controla duplicado si el email cambió (el propio no cuenta).
      if (
        actualizarUsuario.email !== normalizarEmail(usuarioActual.email) &&
        (await UsuarioModel.existeEmail(actualizarUsuario.email, usuarioId))
      ) {
        throw new HttpError(409, 'El email ya está registrado');
      }
    }
    if (actualizarUsuario.telefono) {
      actualizarUsuario.telefono = normalizarTelefono(actualizarUsuario.telefono);
    }

    const usuarioActualizado = await UsuarioModel.update(usuarioId, actualizarUsuario);
    if (!usuarioActualizado) {
      throw new HttpError(404, 'Usuario no encontrado');
    }
    // Omitimos información sensible antes de retornarlo
    const { password_hash, ...usuarioModificado } = usuarioActualizado;
    return usuarioModificado;
  }

};

module.exports = usuarioService;