const authService = require('../services/authService');


const authController = {
    async resgistrarUsuario(req, res) {

        try {
            const datosUsuario = req.body;
            const nuevoUsuario = await authService.resgistrarUsuario(datosUsuario);
            res.status(201).json(nuevoUsuario);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = authController; 