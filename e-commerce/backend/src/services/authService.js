const UsuarioModel = require('../models/UsuarioModel');
const password = require('../utils/passwordHasd');

const authService = {
    //método para añadir un nuevo usuario.
    async resgistrarUsuario(datosUsuario) {
        //se realiza el hash del password
        const hashedPassword = await password.hash(datosUsuario.password);
        datosUsuario.password = hashedPassword
        //verificamos el tipo de usuario.
        /*
          El sistema por el momento admite dos tipos: ADMIN o CLIENTE, al registrarse un nuevo 
          usuario el campo rol vendra null, por lo cual, por defecto se le asignará el rol de CLIENTE. 
        */

        if (datosUsuario.rol == null) datosUsuario.rol = "CLIENTE";

        const nuevoUsuario = { ...datosUsuario };
        // Llamada al modelo para guardar en DB
        const usuarioDB = await UsuarioModel.postUsuario(nuevoUsuario);
        return usuarioDB;
    }

}

module.exports = authService; 

