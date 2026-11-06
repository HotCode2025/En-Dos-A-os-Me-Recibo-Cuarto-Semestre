const UsuarioModel = require('../models/UsuarioModel');
const jwtUtils = require('../utils/jwtUtils');
const HttpError = require('../utils/httpError');
const password = require('../utils/passwordHash');
const { normalizarEmail } = require('../utils/normalizarContacto');

const authService = {
    //método para añadir un nuevo usuario.
    async registrarUsuario(datosUsuario) {
        const email = normalizarEmail(datosUsuario.email);
        // La tabla no tiene UNIQUE en email: el duplicado se controla acá, sin distinguir mayúsculas.
        if (await UsuarioModel.existeEmail(email)) {
            throw new HttpError(409, 'El email ya está registrado');
        }
        //se realiza el hash del password
        const hashedPassword = await password.hash(datosUsuario.password);
        datosUsuario.password = hashedPassword
        // El registro público nunca puede asignar privilegios administrativos.
        const nuevoUsuario = { ...datosUsuario, email, rol: "CLIENTE" };
        const usuarioDB = await UsuarioModel.postUsuario(nuevoUsuario);
        // Aquí limpiamos los datos que no queremos enviar.
        const { password_hash, ...datosPublicos } = usuarioDB;
        // Llamada al modelo para guardar en DB
        return datosPublicos;
    },

    //método para login de usuario. 

    async loginUsuario(loginUsuario) {
        //aquí se hace la consulta a la DB. Pasamos el campo por el cual queremos hacer la búsqueda y el valor. 
        const usuario = await UsuarioModel.getUsuarioBy("email", normalizarEmail(loginUsuario.email))
        // 1. Verificar si el usuario existe
        if (!usuario) {
            throw new HttpError(401, 'Credenciales incorrectas');
        }

        // 2. Verificar si la contraseña coincide (asumiendo que compararPassword es asíncrono)
        const passwordValido = await password.compararPassword(loginUsuario.password, usuario.password_hash);

        if (!passwordValido) {
            throw new HttpError(401, 'Credenciales incorrectas');
        }

        // 3. Si pasa ambas validaciones, el login es exitoso
        // Aquí limpiamos los datos que no queremos enviar, generamos el token y lo retornas
        const { password_hash, ...datosPublicos } = usuario;
        const token = await jwtUtils.generarJWT(usuario.id, usuario.email, usuario.rol); // función para crear el JWT

        return { usuario: datosPublicos, token };
    }

}

module.exports = authService;
