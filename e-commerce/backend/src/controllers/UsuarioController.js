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


  //Método para mostrar el perfil del usuario autenticado. 
  async getPerfil(req, res) {
    try {
      // req.usuario.id viene del payload decodificado del JWT
      const perfil = await usuarioService.getPerfil(req.usuario.id);
      res.status(200).json(perfil);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  //Método para actualizar el perfil de un usuario autenticado. 
  async modificarPerfil(req, res) {
    try {
      const perfilActualizado = await usuarioService.modificarPerfil(req.usuario.id, req.body);
      res.status(200).json(perfilActualizado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

};



module.exports = usuarioController;