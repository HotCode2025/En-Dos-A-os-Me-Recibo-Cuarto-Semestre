//controlador de usuarios
const usuarioService = require('../services/UsuarioService');
const { responderError } = require('../utils/responderError');

const usuarioController = {
  async getAllUsuarios(req, res, next) {
    try {
      const usuarios = await usuarioService.getUsuarios();
      res.status(200).json(usuarios);
    } catch (error) {
      responderError(error, res, next);
    }
  },

  //Método para mostrar el perfil del usuario autenticado.
  async getPerfil(req, res, next) {
    try {
      // req.usuario.id viene del payload decodificado del JWT
      const perfil = await usuarioService.getPerfil(req.usuario.id);
      res.status(200).json(perfil);
    } catch (error) {
      responderError(error, res, next, 404);
    }
  },

  //Método para actualizar el perfil de un usuario autenticado.
  async modificarPerfil(req, res, next) {
    try {
      const perfilActualizado = await usuarioService.modificarPerfil(req.usuario.id, req.body);
      res.status(200).json(perfilActualizado);
    } catch (error) {
      responderError(error, res, next);
    }
  }

};

module.exports = usuarioController;
