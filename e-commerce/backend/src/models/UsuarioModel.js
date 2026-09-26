const pool = require('../config/db');

const Usuario = {
  async getAllUsuarios() {
    const result = await pool.query('SELECT * FROM usuario');
    return result.rows;
  },

  //método para añadir un nuevo usuario 
  async postUsuario(datosUsuario) {
    //1. Obtenermos los campos del usuario

    const { nombre, apellido, email, password, telefono, rol } = datosUsuario;

    //2. Preparamos la consulta
    const query = `
      INSERT INTO usuario (nombre, apellido, email, password_hash, telefono, rol) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, nombre, apellido, email, telefono, rol, fecha_registro
    `;

    //3. Pasamos los valores de la consulta
    const values = [nombre, apellido, email, password, telefono, rol];

    //4. Ejecutamos la consulta y nos devuelve el resultado
    const result = await pool.query(query, values);

    // Retorna el usuario recién creado
    return result.rows[0];

  },

  // Método que esta usandose en: auth (para el lógin), para mostrar el perfil del usuario. 
  async getUsuarioBy(campo, valor) {
    // 1. Validamos las columnas permitidas
    const columnasPermitidas = ['id', 'email', 'username', 'telefono'];

    if (!columnasPermitidas.includes(campo)) {
      throw new Error(`Búsqueda por campo no permitido: ${campo}`);
    }

    // 1. Construir la consulta.
    const query = `SELECT *, password_hash FROM usuario WHERE ${campo} = $1`;
    const result = await pool.query(query, [valor]);

    // 2. Retornarmos el primer resultado (o null si no existe)
    return result.rows[0] || null;
  },

  //método que le permite a un usuario modificar su perfil
  async update(id, { nombre, apellido, email, telefono, calle_numero, ciudad, codigo_postal, pais }) {
    const query = `
      UPDATE usuario
      SET 
        nombre = COALESCE($1, nombre),
        apellido = COALESCE($2, apellido),
        email = COALESCE($3, email),
        telefono = COALESCE($4, telefono),
        calle_numero = COALESCE($5, calle_numero),
        ciudad = COALESCE($6, ciudad),
        codigo_postal = COALESCE($7, codigo_postal),
        pais = COALESCE($8, pais)
      WHERE id = $9
      RETURNING id, nombre, apellido, email, telefono, calle_numero, ciudad, codigo_postal, pais, rol;
    `;
    
    const values = [
      nombre || null, 
      apellido || null, 
      email || null, 
      telefono || null, 
      calle_numero || null, 
      ciudad || null, 
      codigo_postal || null, 
      pais || null, 
      id
    ];

    const { rows } = await pool.query(query, values);
    return rows[0]; // Retorna el usuario actualizado
  }
};

module.exports = Usuario;