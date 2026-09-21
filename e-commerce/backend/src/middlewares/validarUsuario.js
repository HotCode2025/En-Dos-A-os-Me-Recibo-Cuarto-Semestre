const { body, validationResult } = require('express-validator');


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
            .notEmpty().withMessage('El email es requerido')
            .isEmail().withMessage('Debe tener formato de correo válido'),

        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
            .isLength({ min: 5 }).withMessage('La contraseña debe tener al menos 5 caracteres'),

        body('telefono')
            .notEmpty().withMessage('El teléfono es requerido')
            .isNumeric().withMessage('El teléfono debe ser numérico'),

        /*En el campo rol se valida que loS tipos de datos aceptados son: NULL (no se envió el campo, 
        es este caso sería cuando se registra un usuario), ADMIN o CLIENTE*/
        body('rol')
            .optional()
            .isIn(['ADMIN', 'CLIENTE']).withMessage('El rol debe ser ADMIN o CLIENTE'),

        resultValidacion
    ],
    //reglas para POST /auth/login 
    login: [body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe tener formato de correo válido'),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
    ],
    edit: [ /* reglas para PUT /users/:id */]
};

module.exports = validarUsuario;