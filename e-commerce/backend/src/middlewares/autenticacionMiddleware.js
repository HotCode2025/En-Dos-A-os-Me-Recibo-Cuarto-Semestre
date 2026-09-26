const jwtUtils = require("../utils/jwtUtils");

const autenticacionMiddleware = {
<<<<<<< HEAD
  verificarToken(req, res, next) {
    // 1. Obtenemos el encabezado de autorización
    const cabeceraAutenticacion = req.headers["authorization"];
    // AGREGA ESTA LÍNEA:
    console.log("Lo que recibe el middleware:", cabeceraAutenticacion);
=======
    verificarToken(req, res, next) {
        // 1. Obtenemos el encabezado de autorización
        const cabeceraAutenticacion = req.headers['authorization'];
>>>>>>> 9da45f1cbfd0d134e762d6f159d817beeb74ddb4

    // Separamos el texto por el espacio para obtener solo el token (quitando 'Bearer')
    const token = cabeceraAutenticacion && cabeceraAutenticacion.split(" ")[1];

<<<<<<< HEAD
    // 2. Si no hay token en la petición, rechazamos la petición (401 No Autorizado)
    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: "Acceso no autirizado",
      });
=======
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

            // 4. Guardamos el id, email, rol del usuario directamente en la petición (req)
            const { id, email, rol } = datosDecodificados;
            req.usuario = { id, email, rol };

            // 5. Todo está bien, damos paso a la siguiente función
            next();
        } catch (error) {
            // Si el token expiró o fue alterado (403 Prohibido)
            return res.status(403).json({
                ok: false,
                mensaje: 'Token inválido o expirado.'
            });
        }
>>>>>>> 9da45f1cbfd0d134e762d6f159d817beeb74ddb4
    }

    try {
      // 3. Validar si el token es legítimo
      const datosDecodificados = jwtUtils.verificarTokenJWT(token);

      // 4. Guardamos el ID del usuario directamente en la petición (req)
      req.usuario = { id: datosDecodificados.id };

      // 5. Todo está bien, damos paso a la siguiente función
      next();
    } catch (error) {
      // Si el token expiró o fue alterado (403 Prohibido)
      return res.status(403).json({
        ok: false,
        mensaje: "Token inválido o expirado.",
      });
    }
  },
};

module.exports = autenticacionMiddleware;
