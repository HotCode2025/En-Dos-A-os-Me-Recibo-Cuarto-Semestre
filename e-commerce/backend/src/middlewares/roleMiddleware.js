/**
 * Permite el acceso solo a los usuarios que tengan uno de los roles permitidos.
 * @param {...string} rolesPermitidos - Lista de roles con permiso (ej: 'admin', 'editor')
 */

const roleMiddleware = {
    permitRoles(...rolesPermitidos) {
        return (req, res, next) => {
            /* req.usuario fue inyectado previamente por el middleware verificarToken,
            esta porción de código actúa como un puente de seguridad en caso que no se 
            hay inyectado en primer lugar el middleware que controla el acceso. 
            
            */
            if (!req.usuario || !req.usuario.rol) {
                return res.status(401).json({ error: 'Acceso no autorizado' });
            }
            //denegamos el acceso en caso que no tenga el rol autorizado para ingresar en la ruta solicitada
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    error: `Acceso denegado: Se requiere rol de [${rolesPermitidos.join(', ')}]`
                });
            }
            next(); // El usuario tiene el rol permitido, continua a la siguiente función
        };
    }
}

module.exports = roleMiddleware;