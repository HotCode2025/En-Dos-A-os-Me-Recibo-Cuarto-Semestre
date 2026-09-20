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

  async loginUsuario(email, password) {
    const usuario = await UsuarioModel.getByEmail(email);
    if (!usuario || usuario.password !== password) {
      throw new Error('Credenciales inválidas');
    }

    // Generamos el token usando el utilitario
    const token = generarToken({ id: usuario.id, email: usuario.email });

    return { usuario, token };
  }

};



module.exports = usuarioController;