const { body, validationResult } = require('express-validator');
const { normalizarTelefono, telefonoValido } = require('../utils/normalizarContacto');

const MENSAJE_TELEFONO = 'El teléfono debe tener entre 6 y 20 caracteres: dígitos, espacios o guiones, con un + opcional al inicio';


//función middlewares para validar los campos del usuario
const resultValidacion = (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            tipo: error.array()
        });
    }
    next();
};

/*
    En la ruta de usaurio pasamos como paramétro un array que valida los campos que se envian del front, se ejecuta en primera instancia.
    Antes de ser dirigidos, por ejemplo, a la creación del usuario. Esto devuelve un resultado, el cual es capturado 
    por la función resultValidacion, si todo cumple con los requrimiento de validación, la función 
    continúa su ejecución, sino provoca el error, el cual es devuelto al front.  

*/
const validarUsuario = {
    //reglas para POST /users
    nuevoUsuario: [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido'),

        body('apellido')
            .trim()
            .notEmpty().withMessage('El apellido es requerido'),

        body('email')
            .trim()
            .toLowerCase()
            .notEmpty().withMessage('El email es requerido')
            .isEmail().withMessage('Debe tener formato de correo válido'),

        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
            .isLength({ min: 5 }).withMessage('La contraseña debe tener al menos 5 caracteres'),

        body('telefono')
            .trim()
            .notEmpty().withMessage('El teléfono es requerido')
            .custom(telefonoValido).withMessage(MENSAJE_TELEFONO)
            .customSanitizer(normalizarTelefono),

        resultValidacion
    ],
    //reglas para POST /auth/login
    login: [body('email')
        .trim()
        .toLowerCase()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe tener formato de correo válido'),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida'),

    resultValidacion
    ],
    //reglas para PUT /usuarios/perfil: todos los campos son opcionales, pero los que llegan se validan y normalizan
    editarPerfil: [
        body('email')
            .optional({ values: 'falsy' })
            .trim()
            .toLowerCase()
            .isEmail().withMessage('Debe tener formato de correo válido'),

        body('telefono')
            .optional({ values: 'falsy' })
            .trim()
            .custom(telefonoValido).withMessage(MENSAJE_TELEFONO)
            .customSanitizer(normalizarTelefono),

        resultValidacion
    ]
};

module.exports = validarUsuario;