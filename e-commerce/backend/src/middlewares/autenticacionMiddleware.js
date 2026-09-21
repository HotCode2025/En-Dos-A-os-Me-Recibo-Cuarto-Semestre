const jwtUtils = require('../utils/jwtUtils');

const autenticacionMiddleware = {
    verificarToken (req, res, next) {
        // 1. Obtenemos el encabezado de autorización
        const cabeceraAutenticacion = req.headers['authorization'];

        // Separamos el texto por el espacio para obtener solo el token (quitando 'Bearer')
        const token = cabeceraAutenticacion && cabeceraAutenticacion.split(' ')[1];

        // 2. Si no hay token en la petición, rechazamos la petición (401 No Autorizado)
        if (!token) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Acceso no autirizado'
            });
        }

        try {
            // 3. Validar si el token es legítimo
            const datosDecodificados = jwtUtils.verificarTokenJWT(token);

            // 4. Guardamos el ID del usuario directamente en la petición (req)
            req.usuarioId = datosDecodificados.id;

            // 5. Todo está bien, damos paso a la siguiente función
            next();
        } catch (error) {
            // Si el token expiró o fue alterado (403 Prohibido)
            return res.status(403).json({
                ok: false,
                mensaje: 'Token inválido o expirado.'
            });
        }
    }
}

module.exports = autenticacionMiddleware;
