const jwt = require('jsonwebtoken');
const JWT_EXPIRES_IN = '2h'; // Tiempo de expiración configurable

// Sin clave por defecto: si falta JWT_SECRET no se firman ni se aceptan tokens.
function obtenerSecreto() {
    const secreto = process.env.JWT_SECRET;
    if (!secreto) {
        throw new Error('JWT_SECRET no está definido');
    }
    return secreto;
}

const jwtUtils = {

    generarJWT(id, email, rol) {

        return new Promise((res, rej) => {
            const payload = {
                id,
                email,
                rol
            }
            let secreto;
            try {
                secreto = obtenerSecreto();
            } catch (error) {
                return rej(error.message);
            }
            jwt.sign(payload, secreto, {
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
        return jwt.verify(token, obtenerSecreto());
    }
}

module.exports = jwtUtils;
