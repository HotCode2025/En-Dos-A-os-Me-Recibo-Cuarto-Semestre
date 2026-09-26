const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';
const JWT_EXPIRES_IN = '2h'; // Tiempo de expiración configurable

const jwtUtils = {

    generarJWT(id, email, rol) {

        return new Promise((res, rej) => {
            const payload = {
                id,
                email, 
                rol
            }
            jwt.sign(payload, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            }, (error, token) => {

                if (error) {
                    return rej('no se puede generar el JWT');
                } else {
                    return res(token);
                }
            });
        })
    },

    verificarTokenJWT(token) {
        return jwt.verify(token, JWT_SECRET);
    }
}

module.exports = jwtUtils; 
