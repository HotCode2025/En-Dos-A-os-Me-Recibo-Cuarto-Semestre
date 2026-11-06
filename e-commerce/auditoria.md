# Auditoría técnica — E-commerce PuntoZero

> Fecha: 2026-11-06 · Alcance: todo el directorio `e-commerce/` (backend, frontend y archivos de raíz).
> Stack: Vue 3 + Vite · Node.js + Express 5 · PostgreSQL (Neon) · Mercado Pago · Deploy del backend en Render.
> Tipo de revisión: estática (lectura de código y configuración). No se modificó código funcional.

---

## 1. Resumen ejecutivo

El proyecto tiene una base sólida para su etapa: el backend respeta una arquitectura por capas (rutas → controladores → servicios → modelos), usa SQL parametrizado, hashea contraseñas con bcrypt y protege rutas con JWT y roles. El frontend centraliza las llamadas HTTP y ya consume el backend real para catálogo, carrito, órdenes y pagos.

Los riesgos más importantes se concentran en la **integración reciente de pagos**: hay una credencial de producción escrita en el código y el monto a cobrar lo decide el navegador. También faltan piezas de integridad de negocio (stock y estados de orden) y un manejo de errores uniforme.

| Área                      | Estado | Comentario                                                                          |
| ------------------------- | :----: | ----------------------------------------------------------------------------------- |
| A. Seguridad crítica      |   🔴   | Token de Mercado Pago hardcodeado, monto manipulable, secreto JWT por defecto       |
| B. Seguridad general      |   🟠   | Sin rate limiting ni `helmet`, validaciones incompletas, SSL sin verificar          |
| C. Pagos y órdenes        |   🔴   | Sin webhook, sin control de stock al confirmar, estados sin reglas                  |
| D. Carrito                |   🟡   | Funciona con backend; el carrito de invitado se pierde al recargar                  |
| E. Canal Front/Back       |   🟡   | Cliente HTTP centralizado; errores y CORS inconsistentes                            |
| F. Arquitectura y calidad |   🟡   | Capas bien pensadas pero aplicadas a medias; `App.vue` sobredimensionado; sin tests |

**Acción inmediata recomendada:** rotar el access token de Mercado Pago desde el panel de desarrolladores y moverlo a una variable de entorno (ver hallazgo A1).

---

## 2. Arquitectura actual

### 2.1 Estructura

```text
e-commerce/
├── backend/
│   ├── index.js                 # Punto de entrada: carga .env y levanta Express
│   ├── estructura-carpetas.md   # Documentación interna del backend
│   ├── ruta-server.txt          # URL del deploy en Render
│   └── src/
│       ├── app.js               # Configuración de Express, CORS y montaje de rutas
│       ├── config/              # db.js (Pool pg) · initDb.js (verificación de esquema)
│       ├── routes/              # 9 routers (auth, usuarios, productos, inventario, carrito, órdenes, métodos de pago, pagos)
│       ├── controllers/         # 7 controladores HTTP
│       ├── services/            # 5 servicios de negocio
│       ├── models/              # 6 modelos con SQL
│       ├── middlewares/         # JWT, roles, validación de usuario
│       └── utils/               # jwtUtils.js · passwordHash.js
├── frontend/
│   ├── index.html
│   ├── vite.config.js           # Proxy /api → localhost:3001
│   └── src/
│       ├── main.js · router.js · App.vue
│       ├── services/            # api.js (cliente HTTP) · auth.js (login) · catalog.js (normalización)
│       ├── stores/auth.js       # Sesión con refs de Vue + sessionStorage
│       ├── views/               # Home, Products, About, Contact, Login
│       └── components/          # ProductCatalog.vue
└── README.md
```

### 2.2 Flujo de una petición

```text
Vue (App.vue / views)
  └─ services/api.js  apiRequest()  ── agrega Authorization: Bearer <JWT>
        │  fetch  VITE_API_BASE_URL || /api/v1   (en dev, proxy de Vite → :3001)
        ▼
Express app.js ── cors() ── express.json()
  └─ /api/v1/... router
        └─ verificarToken → permitRoles → controller → service → model → PostgreSQL
```

### 2.3 Diagnóstico de la estructura

- **Backend:** la separación en capas es correcta y fácil de seguir. El problema es la aplicación despareja:
  - Productos e inventario van del controlador directo al modelo, sin servicio.
  - Pagos (`routes/pagoRoute.js`) tiene la lógica de negocio dentro de la ruta.
  - Las rutas se montan en dos lugares: `app.js:43-46` y `routes/api.js`.
- **Frontend:** `App.vue` (825 líneas) concentra el estado del catálogo, el carrito, el checkout, el CRUD de administración y la sesión. Las vistas solo reenvían props y eventos. No hay un store dedicado (Pinia) ni guards en el router.
- **Base de datos:** no hay esquema, migraciones ni seeds versionados. `config/initDb.js` solo verifica que existan tablas y columnas; no permite recrear la base desde cero.

---

## 3. Canal de comunicación Front/Back

### 3.1 Puntos fuertes

- `frontend/src/services/api.js` centraliza `fetch`: arma la URL base desde `VITE_API_BASE_URL`, inyecta el token, setea `Content-Type` y parsea la respuesta de forma defensiva (tolera cuerpos vacíos o no JSON).
- `frontend/src/services/catalog.js` normaliza los nombres de columnas del backend (`nombre`, `precio`) al modelo del front (`name`, `price`) y valida la forma de la respuesta.
- Versionado de la API bajo `/api/v1`.
- Proxy de Vite (`vite.config.js`) que evita problemas de CORS en desarrollo.
- `verificarToken` y `permitRoles` son pequeños, legibles y defensivos (`permitRoles` falla cerrado si falta `req.usuario`).

### 3.2 Cuellos de botella

| #    | Hallazgo                                                                        | Ubicación                                                          | Impacto                                                                                                                                                                                                   | Sugerencia                                                                          |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| E17  | Rutas montadas en dos lugares                                                   | `backend/src/app.js:43-46`, `backend/src/routes/api.js`            | Difícil saber qué está protegido y dónde                                                                                                                                                                  | Montar todo en `routes/api.js`                                                      |
| E18a | Todo error se responde como `400`, incluso fallas de base de datos              | Controladores de auth, carrito, órdenes, usuarios, métodos de pago | El front no distingue un error de datos de una caída del servidor                                                                                                                                         | Errores tipados (`ValidationError`, `NotFoundError`) + middleware de errores global |
| E18b | `error.message` crudo hacia el cliente                                          | p. ej. `authController.js:13`                                      | Cualquier error de `pg` llega tal cual al cliente; por ejemplo, con una restricción `UNIQUE` en `usuario.email`, un registro duplicado devolvería `duplicate key value…` y expondría detalles del esquema | Mapear errores conocidos (código `23505`) a mensajes de negocio                     |
| E18c | Login responde `201 Created`                                                    | `authController.js:23`                                             | Semántica HTTP incorrecta                                                                                                                                                                                 | Responder `200`                                                                     |
| E18d | Formatos de respuesta mezclados: `{error}`, `{ok, mensaje}`, `{mensaje, datos}` | Middlewares y controladores                                        | El front necesita lógica extra (`result.error \|\| result.mensaje`)                                                                                                                                       | Un único contrato, p. ej. `{ data }` / `{ error: { code, message } }`               |
| E18e | Sin handler de 404 ni middleware de errores global                              | `app.js`                                                           | Express devuelve HTML por defecto ante rutas inexistentes                                                                                                                                                 | Agregar ambos al final de `app.js`                                                  |
| E19  | CORS con orígenes hardcodeados a localhost                                      | `app.js:10`                                                        | El front desplegado no podrá consumir el backend de Render                                                                                                                                                | `CORS_ORIGIN` por variable de entorno (lista separada por comas)                    |
| E20  | `LoginView.vue` hace su propio `fetch` en lugar de usar `apiRequest`            | `frontend/src/views/LoginView.vue:19`                              | Lógica duplicada de URL base y parseo                                                                                                                                                                     | Crear `services/auth.js` sobre `apiRequest`                                         |
| B8   | El front no reacciona a `401/403`                                               | `services/api.js`                                                  | Cuando el JWT de 2 h vence, la UI sigue "logueada" pero todas las llamadas fallan                                                                                                                         | En `apiRequest`, ante `401/403` llamar a `logout()` y redirigir a `/login`          |

---

## 4. Revisión de seguridad

Severidades: 🔴 Crítico · 🟠 Alto · 🟡 Medio · 🔵 Bajo.

### 4.1 Manejo de credenciales

| #   | Sev. | Hallazgo                                                                                       | Ubicación                             | Sugerencia                                                                                                                                                                                                  |
| --- | :--: | ---------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  |  🔴  | Access token de Mercado Pago de **producción** (`APP_USR-…`) escrito en el código              | `backend/src/routes/pagoRoute.js:7-8` | Rotar el token en el panel de Mercado Pago, leerlo desde `process.env.MP_ACCESS_TOKEN` y abortar el arranque si falta. El archivo todavía no está versionado en git: corregirlo **antes** del primer commit |
| A3  |  🔴  | Secreto JWT por defecto si falta la variable                                                   | `backend/src/utils/jwtUtils.js:2`     | Eliminar el fallback; si `JWT_SECRET` no está definido, el servidor no debe arrancar. Usar un secreto largo y aleatorio                                                                                     |
| B9  |  🟠  | `frontend/.env` no figura en `frontend/.gitignore`                                             | `frontend/.gitignore`                 | Agregar `.env` y versionar un `.env.example`                                                                                                                                                                |
| B7  |  🟡  | SSL a PostgreSQL sin verificar certificado                                                     | `backend/src/config/db.js:12`         | Neon soporta verificación completa: usar `sslmode=require` en la URL y quitar `rejectUnauthorized: false`                                                                                                   |
| —   |  🔵  | `settings-backup.json` y `.continue/` en la raíz (configuración del editor y asistentes de IA) | Raíz                                  | No contienen claves reales hoy, pero conviene ignorarlos para no filtrar claves a futuro                                                                                                                    |

### 4.2 Tokens y sesión

- ✅ JWT firmado con expiración de 2 h (`jwtUtils.js:3`) y payload mínimo (`id`, `email`, `rol`).
- ✅ El registro público fuerza `rol: "CLIENTE"` (`services/authService.js`), así que nadie puede auto-asignarse `ADMIN`.
- ✅ Mismo mensaje de error para "usuario inexistente" y "contraseña incorrecta" (no permite enumerar usuarios).
- 🟡 **B8** El token se guarda en `sessionStorage` (`frontend/src/stores/auth.js:26`), así que un XSS podría leerlo. Para el alcance actual es aceptable; la alternativa más robusta es una cookie `httpOnly` + `SameSite`.
- 🟡 No hay refresh token ni revocación (logout solo borra el token en el cliente).
- ✅ `verificarToken` responde `401 { error }` ante un token ausente, inválido o vencido; el `403` queda para "autenticado sin permiso" (`permitRoles`).
- ✅ **B8** El front reacciona al `401` con token enviado: `apiRequest` llama al handler registrado en `main.js`, que cierra la sesión y redirige a `/login?redirect=…`. El `403` no cierra la sesión.

**Cookie `httpOnly`: evaluada y no implementada.** Front y API viven en dominios distintos (Render), por lo que una cookie `httpOnly` obligaría a usar `SameSite=None; Secure`, CORS con `credentials: true`, `cookie-parser` en el backend y protección CSRF (token anti-CSRF o doble envío), porque las cookies se mandan solas en cada pedido. Eso agrega superficie de ataque y complejidad que hoy no se justifica: con un único cliente, `sessionStorage` (se borra al cerrar la pestaña) más una expiración corta de 2 h es un riesgo aceptable, siempre que se mantenga la política de no renderizar HTML sin escapar (Vue escapa por defecto). Se reevaluará si el sitio pasa a servirse bajo el mismo dominio que la API.

### 4.3 Validación de inputs

| #   | Sev. | Hallazgo                                                                                                                                           | Ubicación                                      | Sugerencia                                                                                                                                                      |
| --- | :--: | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A2  |  🔴  | `crear-preferencia` toma `total` y `ordenId` del body: un usuario puede pagar $1 por una orden de $500.000, o generar un pago para una orden ajena | `backend/src/routes/pagoRoute.js:13,23`        | Recibir solo `ordenId`; buscar la orden en la base, verificar `id_usuario === req.usuario.id` y `estado = 'Pendiente'`, y armar los ítems desde `detalle_orden` |
| A4  |  🟡  | La regla `login` no incluye `resultValidacion`, así que sus validaciones se ejecutan pero nunca bloquean                                           | `backend/src/middlewares/validarUsuario.js:50` | Agregar `resultValidacion` al final del array. Hoy el servicio falla de forma segura, pero la validación es letra muerta                                        |
| B5  |  🟠  | Sin rate limiting en `/auth/login` ni `/auth/register`                                                                                             | `routes/authRoute.js`                          | `express-rate-limit` en las rutas de auth                                                                                                                       |
| B5  |  🟡  | Contraseña mínima de 5 caracteres, sin otras reglas                                                                                                | `validarUsuario.js:41`                         | Mínimo 8 caracteres                                                                                                                                             |
| B5  |  🟡  | Sin `helmet` ni límite de tamaño del body                                                                                                          | `app.js`                                       | `app.use(helmet())`, `express.json({ limit: '100kb' })`                                                                                                         |
| B6  |  🟠  | `PUT /usuarios/perfil` sin validación: permite cambiar el email sin verificar formato ni duplicados                                                | `services/UsuarioService.js:25`                | Implementar `validarUsuario.edit` (hoy vacío) y manejar el `23505`                                                                                              |
| D16 |  🔵  | `DELETE /carrito/quitar/:productoId` no valida que el parámetro sea entero                                                                         | `controllers/carritoController.js:86`          | Mismo chequeo `Number.isInteger` que en agregar/restar                                                                                                          |
| —   |  🔵  | `getUsuarioBy` permite buscar por `username`, columna que no existe                                                                                | `models/UsuarioModel.js:38`                    | Quitarla de la whitelist                                                                                                                                        |

✅ **Buenas prácticas presentes:** todas las consultas usan parámetros `$1..$n`. La única interpolación dinámica (`ProductoModel.update`, `UsuarioModel.getUsuarioBy`) pasa por una whitelist de columnas. La validación de productos (`ProductoController.validateProduct`) es completa y tipada.

---

## 5. Flujos de negocio

### 5.1 Autenticación

```text
LoginView ──POST /auth/login──▶ validarUsuario.login (no bloquea, A4)
                                 └─ authService.loginUsuario → bcrypt.compare → generarJWT(2h)
          ◀── 201 { usuario, token } (debería ser 200)
login() guarda la sesión en sessionStorage → watch(accessToken) dispara synchronizeCart()
```

✅ Resuelto (T11-T18): el front ya tiene registro (`/registro`), perfil (`/perfil`), "mis órdenes" (`/mis-ordenes`), el panel `/admin` (órdenes, métodos de pago, inventario y usuarios), el botón "Quitar" del carrito y guards de navegación por sesión y rol. El registro y el perfil validan el email (sin distinguir mayúsculas, con 409 si ya existe) y el teléfono.

Falta en el front: recuperación de contraseña (el botón "¿Olvidaste tu contraseña?" de `LoginView.vue` sigue sin hacer nada y el backend no tiene el endpoint).

### 5.2 Carrito

- ✅ Si el usuario está autenticado, cada operación va al backend y luego se recarga el carrito (fuente de verdad en el servidor).
- ✅ `carritoService.agregarItem` valida el stock disponible considerando la cantidad que ya está en el carrito.
- 🟡 **D15** El carrito de invitado vive solo en memoria (`App.vue:17`): se pierde al recargar. Al iniciar sesión, `synchronizeCart` (`App.vue:344`) sube los ítems de a uno. Si uno falla, el resto queda sin sincronizar y el único aviso es un mensaje que desaparece a los 3 segundos.
- 🟡 Hay una condición de carrera en `agregarItem`: dos pedidos simultáneos pueden superar el stock. No es crítico porque el stock no se descuenta en el carrito, sino al confirmar (y hoy ni siquiera ahí, ver C11).

### 5.3 Checkout y pagos

```text
App.vue confirmOrder()
  1. POST /ordenes { direccionId: 1 (fijo), metodoPagoId }
       └─ transacción: INSERT orden 'Pendiente' + detalle_orden + vaciar carrito
  2. si nombre del método incluye "mercado pago" o "tarjeta":
       POST /pagos/crear-preferencia { total: cartTotal (cliente), ordenId }
       └─ Preference.create → init_point
     window.location.href = init_point
  3. Mercado Pago redirige a http://localhost:5173/  ← y la orden nunca se actualiza
```

| #   | Sev. | Hallazgo                                                                                                           | Ubicación                                                 | Sugerencia                                                                                                                                                                                |
| --- | :--: | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C10 |  🔴  | Sin webhook (`notification_url`) ni verificación del pago: las órdenes quedan en `Pendiente` para siempre          | `routes/pagoRoute.js`                                     | Endpoint `POST /pagos/webhook` que consulte el pago a la API de MP, valide la firma (`x-signature`) y pase la orden a `Pagado` de forma idempotente. Usar `external_reference = orden.id` |
| C10 |  🟠  | `back_urls` hardcodeadas a localhost                                                                               | `routes/pagoRoute.js:27`                                  | `FRONTEND_URL` por variable de entorno y una vista de resultado (`/checkout/resultado`)                                                                                                   |
| C11 |  🔴  | Crear la orden no revalida ni descuenta stock, y no bloquea filas                                                  | `models/ordenModel.js:16`                                 | Dentro de la transacción: `SELECT stock FROM producto WHERE id = ANY($1) FOR UPDATE`, validar y `UPDATE producto SET stock = stock - $n`                                                  |
| C11 |  🟠  | El precio de la orden se lee fuera de la transacción                                                               | `services/ordenService.js`                                | Leer los ítems y los precios con el mismo `client` transaccional                                                                                                                          |
| C11 |  🟡  | `direccionId` se envía fijo (`App.vue:238`) y el backend lo ignora (`id_direccion_envio` queda en NULL)            | `App.vue:238`, `ordenModel.js:16`                         | Selección de dirección en el checkout y validación de que pertenezca al usuario                                                                                                           |
| C11 |  🟡  | No se valida que `metodoPagoId` exista y esté activo                                                               | `controllers/ordenController.js`                          | Validarlo en `ordenService`                                                                                                                                                               |
| C12 |  🟡  | El front decide la pasarela comparando el **nombre** del método                                                    | `App.vue:249`                                             | Columna `tipo` (`MERCADOPAGO`, `EFECTIVO`, `TRANSFERENCIA`) o flag `requiere_pasarela`                                                                                                    |
| C13 |  🟡  | `GET /metodos-pago` devuelve también los inactivos                                                                 | `models/metodoPagoModel.js:5`                             | Filtrar `WHERE activo = true` para clientes                                                                                                                                               |
| C13 |  🟡  | `DELETE` físico de un método usado en órdenes falla por la FK y responde `404`                                     | `models/metodoPagoModel.js:52`, `metodoPagoController.js` | Baja lógica (`activo = false`)                                                                                                                                                            |
| C14 |  🟡  | Los estados se validan contra una lista, pero sin reglas de transición (de `Cancelado` se puede pasar a `Enviado`) | `services/ordenService.js:42`                             | Mapa de transiciones permitidas; reponer stock al cancelar                                                                                                                                |
| —   |  🔵  | Total con `parseFloat` sobre `numeric`                                                                             | `carritoService.js`, `ordenService.js`                    | Calcular el total en SQL (`SUM`) o trabajar en centavos                                                                                                                                   |


### 5.4 Cómo se confirma un pago de Mercado Pago

Una orden pasa de `Pendiente` a `Pagado` por tres caminos independientes. Todos terminan en `pagoService.aplicarPago`, así que comparten la validación de monto y moneda, la idempotencia (`marcarComoPagada` solo actúa si la orden sigue `Pendiente`) y el reembolso automático si la orden ya estaba cancelada.

| Camino | Endpoint | Cuándo se dispara | Requisito |
| --- | --- | --- | --- |
| Webhook | `POST /pagos/webhook` | Mercado Pago avisa por su cuenta cuando se acredita el pago | `BACKEND_PUBLIC_URL` pública (de ahí sale `notification_url`). En `localhost` Mercado Pago nunca llega al backend |
| Retorno al sitio | `POST /pagos/confirmar` (con `payment_id`) o `POST /pagos/sincronizar/:id` (con `external_reference`) | El usuario vuelve a `/?pago=exito` | Que vuelva en la misma pestaña, con sesión. En local no hay `auto_return` ni botón "Volver al sitio" |
| Conciliación activa | `POST /pagos/sincronizar/:ordenId` y `POST /pagos/sincronizar-pendientes` | Tras iniciar sesión, al abrir "Mis órdenes" (y con "Actualizar estado") y con "Verificar pago" en el admin | `MP_ACCESS_TOKEN`. Sin él devuelve las órdenes sin cambios |

La conciliación busca en Mercado Pago los pagos de la orden por `external_reference` (`Payment.search`) y aplica el primero aprobado. Un cliente solo puede sincronizar sus propias órdenes (ajena: 404); un ADMIN, cualquiera.

- **Producción (Render):** con `BACKEND_PUBLIC_URL` definida el webhook confirma el pago en segundos. La conciliación queda como red de seguridad si la notificación se pierde.
- **Local:** sin webhook ni retorno confiable, la conciliación activa es lo que mantiene las órdenes al día. El mensaje "¡Pago aprobado!" solo se muestra cuando el estado real de la orden es `Pagado`.

---

## 6. Calidad, mantenibilidad y DX

| #   | Hallazgo                                                                                                                                                                                                                                                                           | Sugerencia                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| F21 | Capa de servicios incompleta (productos e inventario sin servicio; pagos en la ruta)                                                                                                                                                                                               | `productoService`, `inventarioService` y `pagoService`                                                                                 |
| F22 | `App.vue` de 825 líneas con múltiples responsabilidades                                                                                                                                                                                                                            | Extraer `CartDrawer.vue` y `CheckoutModal.vue`; mover estado a Pinia (`useCartStore`, `useAuthStore`, `useCatalogStore`) o composables |
| F22 | Router sin guards; el admin solo se oculta en la UI (el backend sí protege)                                                                                                                                                                                                        | `meta: { requiresAuth, roles }` + `router.beforeEach`                                                                                  |
| F23 | Sin esquema SQL, migraciones ni seeds                                                                                                                                                                                                                                              | Carpeta `backend/db/` con `schema.sql` y `seed.sql`, o una herramienta de migraciones (`node-pg-migrate`)                              |
| F23 | Sin tests                                                                                                                                                                                                                                                                          | Backend: Jest/Vitest + Supertest sobre auth, carrito y órdenes. Frontend: Vitest + Vue Test Utils                                      |
| F23 | Sin linter ni formatter (mezcla de comillas simples/dobles y de indentación)                                                                                                                                                                                                       | ESLint + Prettier en ambos proyectos                                                                                                   |
| F23 | Catálogo sin paginación                                                                                                                                                                                                                                                            | `?page=&limit=` en `GET /productos`                                                                                                    |
| F24 | Archivos sin uso: `HelloWorld.vue` y los assets que solo él usa (`hero.png`, `vite.svg`, `vue.svg`), `public/icons.svg`, `package-lock.json` vacío en raíz, `settings-backup.json`, `.vscode/settings.json` (exclusiones de Ren'Py), `backend/.vscode/settings.json` (Live Server) | Eliminar o ignorar                                                                                                                     |
| F24 | Nombres con typos: `passwordHasd.js`, `resgistrarUsuario`                                                                                                                                                                                                                          | Renombrar (`passwordHash.js`, `registrarUsuario`)                                                                                      |
| F24 | `pool.on('error')` hace `process.exit(-1)`                                                                                                                                                                                                                                         | Loguear y dejar que el pool se recupere; usar un process manager en producción                                                         |
| —   | Sin scripts de arranque conjunto                                                                                                                                                                                                                                                   | Script en la raíz con `concurrently` para levantar back y front                                                                        |

---

## 7. Roadmap / plan de acción

### Iteración 0 — Urgente (antes del próximo commit)

- [x] **A3** Eliminar el fallback de `JWT_SECRET` y validar variables obligatorias al arrancar.
- [x] **A4** Agregar `resultValidacion` a la regla `login`.
- [x] **B9** Ignorar `frontend/.env` y crear `.env.example` (front listo; el de back queda pendiente, las variables están en el README).

### Iteración 1 — Dinero y stock

- [x] **A2** El monto del pago sale de la orden en la base; verificar dueño y estado.
- [x] **C10** Webhook de Mercado Pago con verificación de firma, `external_reference` y `back_urls` por entorno.
- [x] **C11** Control de stock con `FOR UPDATE` dentro de la transacción. Decisión: el stock se descuenta al pasar a `Pagado`, no al crear la orden. Dirección de envío: pendiente, la tabla `direccion` del ERD no existe en la base.
- [x] **C13** Métodos de pago: filtrar inactivos y baja lógica.
- [x] **C14** Máquina de estados de orden y reposición de stock al cancelar.
- [x] **D16** Validar `productoId` en `quitar`.
- [x] **Nuevo** Al aprobarse el pago, volver automáticamente a la página principal (`auto_return` + `back_urls` a `FRONTEND_URL/?pago=exito`); la página confirma el pago y muestra el resultado. Requiere un `FRONTEND_URL` público.

### Iteración 2 — Robustez de la API y del front

- [x] **B8** Manejo global del `401` con token en `apiRequest` (auto-logout y redirect a `/login?redirect=`); el `403` no cierra la sesión. Cookie `httpOnly` evaluada y documentada, no implementada (ver §4.2).
- [x] **E17** Unificar el montaje de rutas en `routes/api.js`.
- [x] **E18** Middleware de errores global, handler 404, contrato de error único `{ error, code? }` (las respuestas exitosas no cambian), login `200`, `verificarToken` `401`. Los servicios de carrito, métodos de pago y órdenes todavía lanzan `Error` comunes; `responderError` los responde con su status previo y delega al handler los errores de `pg`.
- [x] **E19** `CORS_ORIGIN` por entorno.
- [x] **E20** `LoginView` usa `services/auth.js` (`loginRequest`) sobre `apiRequest`.

### Iteración 3 — Arquitectura y calidad

- [x] **F21** Completar la capa de servicios (`productoService`, `inventarioService`, `utils/parseId.js`; `pagoService` ya existía).
- [x] **F24** Limpieza de archivos muertos (HelloWorld y assets, `icons.svg`, `package-lock.json` de la raíz, `.vscode/settings.json` de raíz y backend), `settings-backup.json` y `.continue/` ignorados en `e-commerce/.gitignore`, y renombres `passwordHash.js` / `registrarUsuario`. El `pool.on('error')` se resolvió en la iteración 4.
- [x] CI (GitHub Actions) que ejecute los tests del backend en cada push y pull request (`.github/workflows/e-commerce.yml` en la raíz del repo; sin lint, sin build, sin deploy y sin secrets).

### Iteración 4 — Revisión final antes de la demo (2026-11-06)

Dos revisiones de solo lectura (backend y frontend) sobre el sistema ya probado por el usuario. Sin fugas de `password_hash`, sin IDOR ni escalada de rol, sin doble descuento de stock ni doble reembolso, rutas y guards correctos. Se corrigieron estos hallazgos:

| Severidad | Hallazgo | Estado |
| :-: | --- | --- |
| 🔴 | `pool.on('error')` hacía `process.exit(-1)`: Neon corta conexiones inactivas y tiraba el servidor | Resuelto: solo se registra el error (`manejarErrorDelPool`, con test) |
| 🔴 | "Salir" desde una ruta protegida dejaba la pantalla visible y fallando | Resuelto: vuelve a `/` |
| 🟠 | `pagoController` reenviaba el `status` de cualquier error; un 401 de Mercado Pago deslogueaba al cliente al pagar | Resuelto: solo `HttpError` expone su status, el resto responde 502 con mensaje fijo (con tests) |
| 🟠 | `initDb.js` exigía `direccion` y `orden.id_direccion_envio`, inexistentes en la base | Resuelto: se quitaron del verificador |
| 🟠 | Checkout leía el método de pago después de crear la orden; el carrito de invitado se cortaba en el primer ítem sin stock | Resuelto: valida antes del `POST /ordenes`; sincroniza por ítem y avisa cuáles no pasó |
| 🟡 | Puerto del backend inconsistente (3000 / 3001) | Resuelto en `index.js`, proxy de Vite, README y `estructura-carpetas.md` (queda pendiente el comentario de `frontend/.env.example`) |
| 🟡 | Esc no cerraba modales; imagen rota en el carrito; menú móvil sin scroll ni cierre al navegar; textos sin voseo; "¿Olvidaste tu contraseña?" sin acción; `aria-label` faltantes; umbral de envío gratis duplicado | Resuelto |
| 🔵 | `require` sin uso en `UsuarioService`, `SELECT *, password_hash` redundante | Resuelto |

Decisiones del usuario, sin cambios: los textos de marketing del home ("6 cuotas", "Envíos a todo el país", "Garantía oficial", "OFERTAS"), la zona horaria de `fecha_pedido`, el `COALESCE` del perfil que no permite vaciar campos y el trap de foco completo en los modales.

---

## 8. Fortalezas a conservar

- Arquitectura por capas clara y consistente en la mayoría de los módulos.
- SQL 100 % parametrizado, con whitelist para columnas dinámicas.
- bcrypt para contraseñas y rol `CLIENTE` forzado en el registro.
- Middlewares de autenticación y roles simples y defensivos.
- Creación de órdenes transaccional (`BEGIN` / `COMMIT` / `ROLLBACK`) con liberación del cliente en `finally`.
- Validación de productos completa y tipada.
- `initDb.js` como verificador del esquema contra el ERD.
- Cliente HTTP centralizado y normalización de datos en el front.
- Atención a la accesibilidad en la UI (`aria-label`, `role="alert"`, `aria-hidden`).
