const authService = require('../services/authService');


const authController = {
    //método que permite añadir un nuevo usuario
    async resgistrarUsuario(req, res) {

        try {
            const datosUsuario = req.body;
            const nuevoUsuario = await authService.resgistrarUsuario(datosUsuario);
            res.status(201).json(nuevoUsuario);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    //método para login de un usuario. 
     async loginUsuario(req, res) {

        try {
            const datosUsuario = req.body;
            const loginUsuario = await authService.loginUsuario(datosUsuario);
            res.status(201).json(loginUsuario);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = authController; 