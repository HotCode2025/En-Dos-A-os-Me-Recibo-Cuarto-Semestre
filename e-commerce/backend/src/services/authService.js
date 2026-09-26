const UsuarioModel = require('../models/UsuarioModel');
const jwtUtils = require('../utils/jwtUtils');
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
    },

    //método para login de usuario. 

    async loginUsuario(loginUsuario) {
        //aquí se hace la consulta a la DB. Pasamos el campo por el cual queremos hacer la búsqueda y el valor. 
        const usuario = await UsuarioModel.getUsuarioBy("email", loginUsuario.email)
        // 1. Verificar si el usuario existe
        if (!usuario) {
            throw new Error('Credenciales incorrectas');
        }

        // 2. Verificar si la contraseña coincide (asumiendo que compararPassword es asíncrono)
        const passwordValido = await password.compararPassword(loginUsuario.password, usuario.password_hash);

        if (!passwordValido) {
            throw new Error('Credenciales incorrectas');
        }

        // 3. Si pasa ambas validaciones, el login es exitoso
        // Aquí limpiamos los datos que no queremos enviar, generamos el token y lo retornas
        const { password_hash, ...datosPublicos } = usuario;
        const token = await jwtUtils.generarJWT(usuario.id, usuario.email, usuario.rol); // función para crear el JWT

        return { usuario: datosPublicos, token };
    }

}

module.exports = authService;

