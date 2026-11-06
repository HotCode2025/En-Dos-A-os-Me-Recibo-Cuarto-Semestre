# Estructura del backend

```text
backend/
├── src/
│   ├── config/       # PostgreSQL y verificación de esquema
│   ├── controllers/  # Controladores HTTP
│   ├── middlewares/  # Validación, autenticación, permisos por rol y manejo global de errores
│   ├── models/       # Consultas SQL sobre las tablas de la base
│   ├── routes/       # Endpoints de la API
│   ├── services/     # Reglas de negocio (productos, inventario, usuarios, carrito, órdenes, pagos)
│   └── utils/        # JWT, contraseñas (passwordHash.js), HttpError, parseId y responderError
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

Todos los routers se montan en `src/routes/api.js` bajo `/api/v1`; `app.js` solo
monta ese router, `/` y `/test-db`. Al final de `app.js` están el handler 404 en
JSON y el `errorHandler` global (`middlewares/errorHandler.js`). Los errores
siempre se responden como `{ "error": "<mensaje>" }` (con un `code` opcional):
`HttpError` usa su propio status, los códigos `23505` y `23503` de PostgreSQL
responden 409, un JSON mal formado responde 400 y cualquier otro error responde
500 genérico (el detalle queda solo en el log del servidor).

El carrito autenticado usa `carrito` e `item_carrito`; el catálogo limita la
compra al stock disponible. El login usa `usuario.email`, `usuario.password_hash`
y `usuario.rol`. El registro público asigna `CLIENTE`; el alta de administradores
se gestiona fuera del registro público.

`src/config/initDb.js` verifica que existan las tablas y columnas que usa la aplicación.
No crea tablas ni altera la base existente. El backend espera una conexión
PostgreSQL configurada en el entorno del backend.

En desarrollo, Vite reenvía las solicitudes `/api` al backend local en el
puerto `3001`.
