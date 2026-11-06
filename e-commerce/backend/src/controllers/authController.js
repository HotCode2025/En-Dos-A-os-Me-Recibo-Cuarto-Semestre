const authService = require('../services/authService');
const { responderError } = require('../utils/responderError');

const authController = {
    //método que permite añadir un nuevo usuario
    async registrarUsuario(req, res, next) {
        try {
            const datosUsuario = req.body;
            const nuevoUsuario = await authService.registrarUsuario(datosUsuario);
            res.status(201).json(nuevoUsuario);
        } catch (error) {
            responderError(error, res, next);
        }
    },

    //método para login de un usuario.
    async loginUsuario(req, res, next) {
        try {
            const datosUsuario = req.body;
            const loginUsuario = await authService.loginUsuario(datosUsuario);
            res.status(200).json(loginUsuario);
        } catch (error) {
            responderError(error, res, next);
        }
    }
}

module.exports = authController;
