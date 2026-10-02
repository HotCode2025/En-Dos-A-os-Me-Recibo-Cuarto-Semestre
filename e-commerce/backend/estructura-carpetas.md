# Estructura del backend

```text
backend/
├── src/
│   ├── config/       # PostgreSQL y verificación de esquema
│   ├── controllers/  # Controladores HTTP
│   ├── middlewares/  # Validación, autenticación y permisos por rol
│   ├── models/       # Consultas SQL sobre las tablas de la base
│   ├── routes/       # Endpoints de la API
│   ├── services/     # Reglas de negocio
│   └── utils/        # JWT y contraseñas
├── index.js
└── package.json
```

## Catálogo y permisos

El frontend consulta `GET /api/v1/productos`, que lee `producto` y relaciona
`marca`, `categorias` y `valoracion`. Los precios, existencias, imagen,
destacado y puntuación se obtienen de las columnas de `producto`; la cantidad
de opiniones se calcula desde `valoracion`.

Las operaciones para agregar, modificar o eliminar productos requieren un JWT
con rol `ADMIN`:

- `GET /api/v1/productos/opciones` devuelve marcas y categorías para los formularios.
- `POST /api/v1/productos` crea un producto.
- `PUT /api/v1/productos/:id` modifica un producto.
- `DELETE /api/v1/productos/:id` elimina un producto si no está referenciado.

El carrito autenticado usa `carrito` e `item_carrito`; el catálogo limita la
compra al stock disponible. El login usa `usuario.email`, `usuario.password_hash`
y `usuario.rol`. El registro público asigna `CLIENTE`; el alta de administradores
se gestiona fuera del registro público.

`src/config/initDb.js` verifica que las tablas y columnas coincidan con el ERD.
No crea tablas ni altera la base existente. El backend espera una conexión
PostgreSQL configurada en el entorno del backend.

En desarrollo, Vite reenvía las solicitudes `/api` al backend local en el
puerto `3000`.
