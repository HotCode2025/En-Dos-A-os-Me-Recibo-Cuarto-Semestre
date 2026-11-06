# Plan de acción de la auditoría — Iteraciones 0 y 1

Objective: implement roadmap iterations 0 and 1 from `auditoria.md`, plus automatic redirect to the home page after a successful Mercado Pago payment.
Branch: main (no commits — the user commits). Delivery: working tree only. Test runner: `node --test` (built-in, backend).

## Specs

- S1 (A1) Mercado Pago access token is read from `MP_ACCESS_TOKEN`; no credential in source. Payment endpoints answer 503 when it is missing.
- S2 (A3) No `JWT_SECRET` fallback; the server refuses to start without `DATABASE_URL` and `JWT_SECRET`.
- S3 (A4) `POST /auth/login` rule includes `resultValidacion` (invalid input → 400).
- S4 (B9) `frontend/.env` ignored; `.env.example` for backend and frontend.
- S5 (A2) Preference amount and items come from the order stored in the DB; the order must belong to the user and be `Pendiente`.
- S6 (C10) Webhook `POST /pagos/webhook` (signature validated when `MP_WEBHOOK_SECRET` is set) and `POST /pagos/confirmar`; an approved payment whose amount matches marks the order `Pagado` idempotently. `external_reference` = order id.
- S7 User request (L2): "quiero que al pagar con éxito (API de mercado pago) me reedirija automaticamente a mi página principal" → `back_urls.success` = `FRONTEND_URL/` with `auto_return: "approved"`; the home page confirms the payment and shows a notice.
- S8 (C11) Order creation locks products (`FOR UPDATE`), validates stock in the same transaction (no reservation; per L7 stock is decremented when the order becomes `Pagado`), validates an active payment method. Shipping address: none (table `direccion` does not exist in the DB, see L12).
- S9 (C13) `GET /metodos-pago` lists only active methods; `DELETE` deactivates instead of deleting.
- S10 (C14) Order status transitions are enforced; becoming `Pagado` (webhook, confirm or admin) decrements stock (floor 0, warning log if oversold); cancelling a `Pagado` order restores stock, cancelling a `Pendiente` one does not.
- S11 (D16) `DELETE /carrito/quitar/:productoId` validates a positive integer.

## Tasks

- [x] T1 S2-S3 inline — env validation, JWT, login rule (S4 partial: backend/.env.example blocked by permissions)
- [x] T2 S1,S5-S7 inline — payment service/controller/route + frontend return handling
- [x] T3 S8,S10 inline — transactional order creation and status transitions
- [x] T4 S9,S11 inline — payment methods and cart param validation
      Route evidence: one developer, units share files (`ordenModel`, `App.vue`) → no Writer trigger; inline.

## Log

- L1 (2026-11-06) "arranca con el plan de acción, por cierto quiero que al pagar con éxito (API de mercado pago) me reedirija automaticamente a mi página principal, agrega esto a tu plan de acción, recuerda no commitear nada, de eso me encargo yo."
- L2 Decision: `auto_return: "approved"` is sent only when `FRONTEND_URL` is not a local host. Source: Mercado Pago docs (checkout-bricks/payment-brick/advanced-features/preferences): "Não utilize domínios locais no valor `back_urls`, como 'localhost/' ou '127.0.0.1'". Automatic redirect needs the deployed frontend or a tunnel (ngrok).
- L3 `.env` files are not read or written by the agent (permission denied); the user adds `MP_ACCESS_TOKEN` and `FRONTEND_URL`.
- L4 Verification: `npm test` 43/43 GREEN (RED observed first: 17/19 failing). App.vue compiled with @vue/compiler-sfc (vite build blocked in WSL: Windows-installed rolldown binding). Independent verifier: S1-S3, S5-S11 PASS; S4 PARTIAL (backend/.env.example cannot be created: path denied by permission settings). One correction batch: ignore payments without a valid external_reference (no DB query, webhook 200); App.vue refreshes the cart and keeps the order pending when the preference fails.
- L5 Open advisories (not fixed): unpaid orders keep reserved stock with no expiry; payment approved after cancellation is not refunded; CORS still localhost-only (blocks a deployed FRONTEND_URL, iteration 2 item E19).
- L6 (2026-11-06) User: "te doy permiso de hacer todo esto que me planteas". Done: CORS from CORS_ORIGIN/FRONTEND_URL (src/config/cors.js, test/cors.test.js, 46/46 GREEN). Not doable by the agent: token rotation (user MP account), backend .env (permission settings), sandbox payment (needs TEST token).
- L7 (2026-11-06) User decision on unpaid orders holding stock: "Descontar stock al pagar" (option: no reservation at order creation; stock is decremented when payment is approved; two buyers may pay for the last unit). Implemented in ordenModel (descontarStockDeOrden), RED 5 failing → GREEN 51/51.
- L8 (2026-11-06) User decision for an approved payment on a cancelled order: "Reembolsar automático (Recomendado)". Implemented: pagoService.reembolsarPagoDeOrdenCancelada uses PaymentRefund.total with idempotencyKey `reembolso-orden-cancelada-<paymentId>`; also covers the race where the order is cancelled between read and update. App.vue shows a refund notice. RED 3 failing → GREEN 54/54.
- L9 (2026-11-06) User decision for paid orders created before pay-time stock: "Fecha de corte por variable". Implemented STOCK_AL_PAGAR_DESDE (env.js validation, ordenModel.descontoStockAlPagar compares fecha_pedido; limitation: no paid-at column). RED 2 failing → GREEN.
- L10 Verifier 2: L7 PASS, L8 PARTIAL with one blocker — SDK 3.6.1 merges requestOptions into the shared MercadoPagoConfig, so the refund idempotency key leaked into later Preference.create calls. Fixed with an isolated config (crearClienteMercadoPagoAislado); pinned by test/pagoSdkReal.test.js (real SDK, fetch stubbed; RED reproduced before fix). Also fixed: restore-stock path locks products ordered by id (deadlock advisory); race branch test added. Suite 60/60 GREEN. Open: refund policy when an admin cancels an already paid order (advisory 1).
- L11 (2026-11-06) User decision for admin cancelling a paid order: "Reembolsar al cancelar (Recomendado)". Implemented: ordenModel.actualizarEstadoOrden returns { orden, estadoAnterior }; ordenService refunds via pagoService.reembolsarPagosAprobadosDeOrden (Payment.search by external_reference + status approved, same idempotency key as the webhook); refund failure → 502 with manual-refund message after the cancellation is committed. PUT /ordenes/:id/estado response adds `reembolsos`. RED 7 failing → GREEN 66/66 (incl. real-SDK search probe).
- L12 (2026-11-06) User report: `POST /api/v1/ordenes 400 {"error":"relation \"direccion\" does not exist"}`. Cause: the agent-added direccionModel queried a table that exists in the ERD (initDb.js) but not in the Neon DB. Fix: removed direccionModel and direccionId handling; orders are saved with id_direccion_envio NULL as at baseline. RED 2 failing → GREEN 65/65. Data fix by user: `UPDATE metodo_pago SET activo = true WHERE id IN (1, 2)` (Mercado Pago and Tarjeta were inactive and hidden by the active-only listing).
- L13 (2026-11-06) User report: `column "id_direccion_envio" of relation "orden" does not exist`. Cause: agent-added column in the orden INSERT, taken from the ERD (initDb.js) instead of the real schema. Fix: INSERT uses only the baseline columns (id_usuario, id_metodo_pago, estado, total, fecha_pedido); detalle_orden ORDER BY uses id_producto instead of unverified d.id. Every remaining column was already used by the baseline code or seen in the user DB. RED 3 failing → GREEN 66/66.

---

# Iteraciones 2-3 (pendientes del roadmap recortado)

Objetivo: implementar B8, E17, E18, E20, F21, F24 y CI (solo tests). Fuera de alcance por decisión del usuario: B5, B6, B7, F22, D15, F23.
Restricciones: sin commits (los hace el usuario); nada a producción (sin push, deploy, cambios en Render/Neon ni escrituras en la base real); `.env` no se toca. TDD: estricto, fuente = configuración global del usuario, runner `node --test` (`backend/`, `npm test`). Frontend sin test runner: verificación por build local.
Contrato E18: errores `{ error: "<mensaje>" }` (+ `code` opcional); respuestas exitosas sin cambios.
Ruta: delegated direct (un writer; 2+ archivos no triviales).

## Specs

- S12 (E17) Todos los routers se montan en `routes/api.js`; `app.js` solo monta `/api/v1`, `/` y `/test-db`.
- S13 (E18) Handler 404 JSON y `errorHandler` global: HttpError → su status; pg 23505/23503 → 409; JSON inválido → 400; resto → 500 genérico con log.
- S14 (E18) Controllers delegan errores inesperados con `next(err)`; login 200; `verificarToken` 401 `{ error }` (falta/inválido/vencido); credenciales inválidas 401; sin mensajes crudos de pg.
- S15 (F21) `productoService` e `inventarioService` con validación, parseo de IDs, 404 y 409 solo ante 23503; `utils/parseId.js`.
- S16 (B8) `apiRequest` adjunta `error.status`; 401 con token enviado → handler registrado (logout + redirect a `/login?redirect=`); 403 no cierra sesión. Cookie httpOnly evaluada y documentada, no implementada.
- S17 (E20) `services/auth.js` `loginRequest()` sobre `apiRequest`; `LoginView` sin `fetch` propio.
- S18 (F24) Borrado de archivos muertos, `.gitignore` para `settings-backup.json` y `.continue/`, renombres `passwordHash.js` y `registrarUsuario`.
- S19 (CI) `.github/workflows/e-commerce.yml` en la raíz del repo: solo `npm ci` + `npm test` del backend; sin build, deploy ni secrets.

## Tareas

- [x] T5 S12-S13 delegated — montaje único, 404, errorHandler
- [x] T6 S14 delegated — controllers y códigos HTTP
- [x] T7 S15 delegated — servicios de productos e inventario
- [x] T8 S16-S17 delegated — sesión en el front y login
- [x] T9 S18 delegated — limpieza y renombres
- [x] T10 S19 delegated — CI solo tests

## Log

- L14 (2026-11-06) Usuario: "ahora si implementa". Alcance final tras ediciones del roadmap: sin F23 ("lo haremos sin el F23"); CI "Solo test, no pases nada a produccion hasta que yo te diga". Idioma: "en español siempre".
- L15 (2026-11-06) T5 (S12-S13) hecho. Montaje único en `routes/api.js`, `noEncontrado` + `errorHandler` en `middlewares/errorHandler.js`. RED: 13/13 fallando (`errorHandler.test.js` + `app.test.js`, módulos inexistentes) → GREEN 79/79 (66 previos + 13).
- L16 T6 (S14) hecho. `verificarToken` → 401 `{ error }`, login 200, credenciales inválidas `HttpError(401)`, `UsuarioService.getPerfil` `HttpError(404)`. Nuevo `utils/responderError.js`: HttpError → su status; error de pg, rechazo que no es Error o sin mensaje → `next(err)`; Error de negocio común → status previo del controller (los servicios de carrito/métodos de pago/órdenes aún lanzan `Error` comunes, status pinneados por los tests existentes). Renombrado `registrarUsuario` (controller, route, service) en esta tarea porque el controller se reescribió. RED: 13/14 fallando (`autenticacion`, `authYUsuario`, `responderError`) → GREEN 97/97.
- L17 T7 (S15) hecho. `productoService` (validación movida desde el controller, 404, 409 solo con pg 23503; 23503 en alta/edición → 400 de marca/categoría), `inventarioService`, `utils/parseId.js`; controllers livianos sin try/catch (Express 5 reenvía los rechazos al errorHandler). RED: ambos archivos fallan al cargar (módulos inexistentes) → GREEN 120/120.
- L18 T8 (S16-S17) hecho. `apiRequest` adjunta `error.status`; `setUnauthorizedHandler` se dispara solo con 401 y token enviado (opción `skipAuth` para el login, que no manda token ni dispara el handler); `main.js` registra logout + `router.push('/login?redirect=')`; `services/auth.js` con `loginRequest`; `LoginView` sin `fetch` propio (mapeo de `TypeError` intacto). Cookie httpOnly documentada en `auditoria.md` §4.2. `npm run build` en `frontend/`: OK (37 módulos). Sin test runner en el front.
- L19 T9 (S18) hecho. Borrados HelloWorld.vue, hero.png, vite.svg, vue.svg, public/icons.svg, `package-lock.json` de la raíz (vacío: `packages: {}`), `.vscode/settings.json` de raíz y de backend (confirmado por búsqueda que nada los usa). `e-commerce/.gitignore` nuevo con `settings-backup.json` y `.continue/`. Renombres `passwordHash.js` (con `git mv`, queda staged) y `registrarUsuario`. `auditoria.md` y `backend/estructura-carpetas.md` actualizados. Tests 120/120, build OK.
- L20 T10 (S19) hecho. `.github/workflows/e-commerce.yml` en la raíz git: push y pull_request con `paths: ['e-commerce/**']`, un job (Node 22, caché npm, `e-commerce/backend`, `npm ci` + `npm test`), `permissions: contents: read`, sin build/deploy/secrets. `"engines": {"node": ">=20.19"}` en `backend/package.json`. `auditoria.md`: ítem de CI ajustado a "tests". `npm ci --dry-run` OK.
- L21 (2026-11-06) Usuario: "A1 ya completado, dalo por hecho". Prueba de compra real OK; sin redirección automática al inicio porque FRONTEND_URL es local (comportamiento esperado, ver L2). Aviso de pg sobre sslmode: inofensivo, se silencia con sslmode=verify-full en DATABASE_URL (lo cambia el usuario).

---

# Front para endpoints existentes (preparación de la demo)

Objetivo: exponer en el frontend todo lo que el backend ya ofrece (registro, perfil, mis órdenes, panel admin de órdenes/métodos de pago/inventario/usuarios, quitar del carrito) con los ajustes de backend mínimos que esas pantallas necesitan.
Plan aprobado: `~/.claude/plans/modifique-algunas-cosas-en-inherited-forest.md`.
Esquema real de `usuario` (confirmado por el usuario en Neon): email text sin UNIQUE; telefono varchar; fecha_registro con default; rol enum con default 'CLIENTE'; única restricción: PK.
Restricciones: sin commits ni producción; `.env` no se toca; TDD estricto `node --test`; front verificado con build. Ruta: delegated direct (un writer).

## Tareas

- [x] T11 backend — registro y perfil: email normalizado, teléfono flexible, duplicado 409 (LOWER), login case-insensitive, sin 'username', perfil 404
- [x] T12 backend — GET /metodos-pago/admin, PUT acepta activo, parseId en métodos de pago y órdenes, req.body ?? {}
- [x] T13 front — /registro
- [x] T14 front — /perfil
- [x] T15 front — /mis-ordenes
- [x] T16 front — /admin (órdenes, métodos de pago, inventario, usuarios)
- [x] T17 front — botón Quitar en el carrito
- [x] T18 front — guards y navegación

## Log

- L22 (2026-11-06) Usuario: "implementa todo lo que hayas encontrado en el backend y que no está en el front". Plan aprobado.
- L23 (2026-11-06) T11 hecho. Nuevo `utils/normalizarContacto.js` (email trim+lowercase, teléfono a dígitos con + inicial opcional, mínimo 6 dígitos). `validarUsuario`: email normalizado en `nuevoUsuario`/`login`, teléfono con regex `^+?[ds-]{6,20}$` y sanitizado, regla nueva `editarPerfil` (campos opcionales) cableada en `PUT /usuarios/perfil` (reemplaza el `edit: []` vacío). `UsuarioModel.existeEmail(email, excluirId)` con `LOWER(email) = LOWER($1)`; `getUsuarioBy("email")` con `LOWER`; `'username'` fuera de la whitelist. `authService` lanza `HttpError(409, "El email ya está registrado")`; `UsuarioService.modificarPerfil` lanza 409 si el email es de otro usuario y 404 si `update` no devuelve fila. RED: 16 de 19 fallando (`registroYPerfil.test.js` + `usuarioModel.test.js`, nuevos) → GREEN 19/19; suite completa 139/139 (se agregó `existeEmail` al mock de `authYUsuario.test.js` y `ejecutarCadena` a `test/helpers.js`).
- L24 T12 hecho. `GET /metodos-pago/admin` (verificarToken + permitRoles("ADMIN")) declarada antes de `/:id`; `listarTodosMetodosPago` sin filtro; `PUT` acepta `activo` (boolean, otro tipo → 400); `obtenerMetodoPagoPorId` ahora lanza `HttpError(404)` (antes `Error` común, el PUT de un método inexistente daba 400); `parseId` en getById/update/delete de métodos de pago y en `ordenController.actualizarEstado` (id inválido → 400); `req.body ?? {}` en `ordenController`, `carritoController`, `metodoPagoService` (`UsuarioService` ya lo recibió en T11). RED: 12 de 15 fallando (`metodoPagoAdmin.test.js`, nuevo; los 3 que pasaban ya eran verdad por T11 o por el 400 genérico) → GREEN 15/15; suite completa 154/154.
- L25 T13 hecho. `registerRequest` en `services/auth.js` (`skipAuth: true`); `apiRequest` adjunta `error.data` (body de la respuesta) sin romper `error.status`/`message`; `RegisterView.vue` (validación de cliente espejo del backend, repetir contraseña, errores por campo desde `error.data.tipo`, login automático y redirect); `utils/safeRedirect.js` (solo rutas internas) usado también en `LoginView`; links "¿No tenés cuenta? Registrate" y "Crear cuenta" en el header.
- L26 T14 hecho. `services/usuarios.js` (`obtenerPerfil`, `actualizarPerfil`), `ProfileView.vue` (carga/error/reintentar, guardado), `actualizarUsuarioSesion()` en `stores/auth.js` (nombre, apellido, email; nunca rol ni id). Limitación del backend: los campos vacíos no se envían porque el `COALESCE` no permite borrar un valor.
- L27 T15 hecho. `services/ordenes.js` (`misOrdenes`), `MyOrdersView.vue` (badge por estado, fecha `es-AR`, total ARS, estados de carga/vacío/error), `utils/format.js`; el aviso de pago confirmado/pendiente de `App.vue` ofrece "Ver mis órdenes" (el toast con link dura 8 s).
- L28 T16 hecho. `views/admin/` (`AdminLayout` con pestañas `router-link`, `AdminOrdersView`, `AdminPaymentMethodsView`, `AdminInventoryView`, `AdminUsersView`) y `services/admin.js`. Órdenes: select con las transiciones válidas copiadas de `ordenService` (`ORDER_TRANSITIONS` en `utils/format.js`), aviso de reembolsos, error 502/409 con recarga de la lista, confirmación al cancelar una orden pagada. Métodos de pago: alta, edición, desactivar (DELETE) y reactivar (PUT activo: true). Inventario: stock en la fila, 0 resaltado. Usuarios: solo lectura. Tablas dentro de `.table-scroll` (overflow-x: auto). CSS compartido al final de `style.css`.
- L29 T17 hecho. Botón "Quitar" por ítem en el drawer (`aria-label`); logueado: `DELETE /carrito/quitar/:productoId` + `loadCart()`; invitado: filtra el estado local.
- L30 T18 hecho. `meta` (`requiereSesion`, `roles`, `soloInvitados`) y `router.beforeEach` en `router.js`; links del header por sesión y rol (también en el menú móvil, que reutiliza la misma `nav`); "Iniciar compra" sin sesión cierra el drawer y hace `router.push("/login?redirect=/")`.
- L31 Verificación: `cd backend && npm test` 154/154; `cd frontend && npm run build` OK (57 módulos). Sin test runner en el front: las pantallas se prueban a mano (ver checklist del plan). `auditoria.md` §5.1 actualizado.

---

# Conciliación de pagos y perfil

Objetivo: que las órdenes pagadas con Mercado Pago pasen a `Pagado` aunque en local no haya webhook ni retorno al sitio, y que "Mi perfil" guarde los cambios.
Causas: (1) en local MP no notifica (sin `BACKEND_PUBLIC_URL`) ni muestra "Volver al sitio" (back_urls localhost); el usuario vuelve en otra ventana, sin sesión ni `payment_id`, así que `/pagos/confirmar` nunca corre. (2) `PUT /usuarios/perfil` responde 409 porque hay otra fila de `usuario` con el mismo email (sin UNIQUE) y el front reenvía siempre el email.
Restricciones: sin commits ni producción; `.env` no se toca; TDD estricto `node --test`. Ruta: delegated direct (un writer).

## Tareas

- [x] T19 backend — pagoService.sincronizarOrden / sincronizarOrdenDelUsuario / sincronizarPendientesDelUsuario; POST /pagos/sincronizar/:ordenId (dueño o ADMIN) y POST /pagos/sincronizar-pendientes
- [x] T20 front — retorno de MP con/sin payment_id/external_reference, sincronizar tras login, en Mis órdenes y botón admin "Verificar pago"; quitar el "¡Pago aprobado!" sin verificar
- [x] T22 perfil — validar duplicado solo si el email cambió (backend) y enviar email solo si cambió (front)
- [x] T21 documentación — tres caminos de confirmación

## Log

- L32 (2026-11-06) Usuario: "cuando pago con mercado pago me quedo en esa solapa, ni me redirige automaticamente, ni me coloca el boton de volver al sitio" y "en Mi Perfil no me deja editar los datos". Evidencia: `PUT http://localhost:3001/api/v1/usuarios/perfil 409 "El email ya está registrado"`. Plan aprobado.
- L33 T19 hecho. `pagoService.sincronizarOrden` (404 si no existe; sin `MP_ACCESS_TOKEN` o si no está `Pendiente` devuelve la orden sin consultar; `Payment.search` por `external_reference`, aplica el primer pago `approved` con `aplicarPago`), `sincronizarOrdenDelUsuario` (reutiliza `obtenerOrdenDelUsuario`: ajena = 404) y `sincronizarPendientesDelUsuario` (`{ ordenes, pagadas }`, si una falla loguea y sigue). `pagoController.sincronizarOrden` (ADMIN sobre cualquiera, cliente solo la suya, `parseId`) y `sincronizarPendientes`; rutas con `verificarToken`, `/sincronizar-pendientes` declarada antes de `/sincronizar/:ordenId`. RED: 13 de 33 fallando en `pagoService.test.js` (`is not a function`) y 6 de 13 en `pagoController.test.js` → GREEN 33/33 y 13/13.
- L34 T22 hecho. `UsuarioService.modificarPerfil` lee el usuario con `getUsuarioBy("id")` (404 si no existe) y solo llama a `existeEmail` si el email normalizado difiere del actual. Se ajustaron 2 tests previos para fijar el usuario actual. RED: 3 de 17 fallando en `registroYPerfil.test.js` (mismo email con duplicado en la base, otras mayúsculas, 404) → GREEN 17/17. Front: `ProfileView` guarda `loadedEmail` y no envía el email si no cambió.
- L35 T20 hecho. Nuevo `utils/avisos.js` (`avisar` dispara un evento de `window`; `App.vue` lo escucha y usa su `showNotice`). `services/ordenes.js`: `sincronizarPendientes`, `sincronizarOrden`, `sincronizarTrasLogin` (segundo plano, errores ignorados, aviso con link a `/mis-ordenes` si `pagadas.length > 0`), usado en `LoginView` y en el auto-login de `RegisterView`. `handlePaymentReturn`: `payment_id` → `/pagos/confirmar`; `external_reference` → `/pagos/sincronizar/:id`; ninguno con sesión → `/pagos/sincronizar-pendientes`; sin sesión pide iniciar sesión; "¡Pago aprobado!" solo con estado `Pagado`. `MyOrdersView` sincroniza antes de listar y tiene "Actualizar estado". `AdminOrdersView` tiene "Verificar pago" en órdenes `Pendiente` (`verificarPagoOrden` en `services/admin.js`). Sin test runner en el front: prueba manual pendiente del usuario.
- L36 T21 hecho. `auditoria.md` §5.4 "Cómo se confirma un pago de Mercado Pago": webhook (requiere `BACKEND_PUBLIC_URL` pública), retorno al sitio y conciliación activa; en Render el webhook funciona con `BACKEND_PUBLIC_URL` y la conciliación es la red de seguridad.
- L37 Verificación: `cd backend && npm test` 177/177 (154 + 13 + 6 + 4); `cd frontend && npm run build` OK (58 módulos). Pendiente del usuario: duplicados de email en Neon (SQL del plan) y prueba manual en local.
- L38 (2026-11-06) Datos en Neon (ejecutado por el usuario): se conservan usuario 3 (agust@gmail.com) y 8 (alondracliente@gmail.com); las 5 órdenes de la cuenta 7 pasaron a la 8 (36 en total); cuentas 4, 5, 7 y 9 renombradas con prefijo duplicado-<id>-. Pendiente: CREATE UNIQUE INDEX usuario_email_unico ON usuario (LOWER(email)).

---

# Rendimiento de "Mis órdenes"

Objetivo: que "Mis órdenes" muestre la lista de inmediato y concilie con Mercado Pago en segundo plano, acotado y en paralelo.
Causa: `MyOrdersView` esperaba `sincronizar-pendientes` antes de listar; el backend conciliaba en serie todas las pendientes (consulta a Neon + `Payment.search` por orden), incluidas efectivo/transferencia y viejas.
Ruta: delegated direct (un writer). TDD estricto `node --test`. Sin commits ni producción.

## Tareas

- [x] T23 backend — filtro (Pendiente, últimos 7 días, método Mercado Pago/tarjeta vía `usaMercadoPago`), concurrencia 4 con `Promise.allSettled`, `sincronizarOrden(ordenId, ordenConocida)` sin re-lectura
- [x] T24 front — listar primero, conciliar sin bloquear, indicador "Verificando pagos…", actualizar filas si hay pagadas

## Log

- L39 (2026-11-06) Usuario: "lo que noté es que al ir a Mis Ordenes, tarda en traerte los datos". Plan aprobado.
- L40 T23 hecho. `pagoService`: `DIAS_CONCILIACION = 7`, `CONCURRENCIA_CONCILIACION = 4`, `usaMercadoPago(nombre)` (misma fragilidad C12 de `auditoria.md`), `debeConciliarse` (Pendiente + reciente + método de pasarela; fecha inválida no se concilia) y `mapearConConcurrencia` (pool local con `Promise.allSettled`, orden del listado intacto). `sincronizarOrden(ordenId, ordenConocida)` reutiliza la orden del listado si trae id, estado y total (`aplicarPago` no usa los ítems); si falta alguno la relee. `sincronizarOrdenDelUsuario` y el botón del admin no cambian (sin ventana). Contrato `{ ordenes, pagadas }` intacto. RED: 5 de 186 fallando (efectivo, 30 días, paralelismo, sin re-lectura x2) → GREEN 186/186.
- L41 Ajustes a tests existentes de `pagoService.test.js`: `ordenPendiente()` ahora trae `fecha_pedido` y `metodo_pago_nombre: "Mercado Pago"` (antes sin ambos, y el filtro nuevo los exige); el mock de `Payment.search` espera `alBuscar` y acepta que devuelva los resultados propios de cada búsqueda (con búsquedas en paralelo, el `estado.resultadosBusqueda` compartido se pisaba); dos tests existentes pasaron de asignar `resultadosBusqueda` a devolver el arreglo; el mock cuenta lecturas (`estado.lecturas`).
- L42 T24 hecho. `MyOrdersView.vue`: lista primero (`misOrdenes()` y fin del loading), luego `verifyPayments` sin bloquear con indicador `<p role="status">Verificando pagos…</p>`; si `pagadas.length > 0` reemplaza las filas con `ordenes` y avisa "Se confirmó el pago de la orden #N" (`avisar`); error → `console.warn`. "Actualizar estado" reutiliza `loadOrders`. Condiciones de carrera: contador `currentLoad` (cada carga o desmontaje invalida la sincronización anterior). Sin test runner en el front.
- L43 Verificación: `cd backend && npm test` 186/186 (177 + 9 nuevos); `cd frontend && npm run build` OK (59 módulos).

---

# Pulido final antes de la demo

Objetivo: corregir lo encontrado en la revisión final (backend y frontend) sin cambiar funcionalidades.
Ruta: delegated direct (un writer). TDD estricto `node --test`. Sin commits ni producción; `.env` no se toca.

## Tareas

- [x] T25 backend — pool sin process.exit; pagoController: solo HttpError expone status (resto 502); initDb sin direccion/id_direccion_envio; puerto 3001 unificado; limpieza UsuarioService/UsuarioModel
- [x] T26 front — Salir desde ruta protegida va a /; "¿Olvidaste tu contraseña?" como texto; Esc y aria-label en modales; placeholder de imagen en carrito; checkout valida método antes del POST; synchronizeCart por ítem; voseo; menú móvil con scroll y cierre al navegar; constante única de envío gratis; aria-label en buscador
- [x] T27 documentación — README (puertos, variables, ADMIN, índice único, confirmación de pagos, limitaciones) y auditoria.md

## Log

- L44 (2026-11-06) Usuario: "ya probe todo y funciona correctamente, quieres revisar todo por las dudas?". Revisión final: 186/186 tests, build OK; sin fugas de password_hash, IDOR ni doble stock/reembolso. Plan de pulido aprobado.
- L45 (2026-11-06) T25 hecho. `db.js`: `manejarErrorDelPool` (solo `console.error`, sin `process.exit`) expuesto en el pool; se quitó el handler `connect` vacío. `pagoController`: `responderErrorDePago`; solo `instanceof HttpError` expone status y mensaje, cualquier otro error (incluido `status: 401` de MercadoPagoError) responde 502 con mensaje fijo, aplicado a crearPreferencia, confirmarPago, sincronizarOrden y sincronizarPendientes (crearPreferencia pasó de 500 a 502). `initDb.js` sin `direccion` ni `orden.id_direccion_envio`. Puerto 3001 en `index.js`, `vite.config.js`, README y `estructura-carpetas.md`; `cors.js` no se tocó (3000 es origen permitido, no el puerto del backend). Limpieza de `UsuarioService` y `UsuarioModel`. RED: 5 de 191 fallando (2 en `test/db.test.js`, 3 en `pagoController.test.js`) → GREEN 191/191. Pendiente por bloqueo de permisos: comentario de `frontend/.env.example` (sigue diciendo 3000).
- L46 (2026-11-06) T26 hecho. `App.vue`: Salir va a `/` si `route.matched` exige sesión; listener `keydown` Esc (checkout > carrito > menú móvil) con alta/baja en `onMounted`/`onBeforeUnmount`; `synchronizeCart` con try/catch por ítem y aviso de los no pasados; `confirmOrder` valida `metodoElegido` antes del POST y el botón se deshabilita sin método; placeholder `.cart-item-no-image` cuando falta imagen; `aria-label="Cerrar"` en los dos "×" del checkout y "Buscar productos" en el buscador; voseo; cierre del menú móvil con `watch(route.fullPath)`; el texto de envío gratis usa `freeShippingThreshold`. `LoginView.vue`: texto en lugar del botón sin acción. `style.css`: scroll del menú móvil y estilos nuevos. Evidencia: `npm run build` OK.
- L47 (2026-11-06) T27 hecho. README: puertos 3001/5173, cómo crear ADMIN, índice único de email, los tres caminos de confirmación de pago (ref. `auditoria.md` §5.4) y sección "Limitaciones conocidas". `auditoria.md`: Iteración 4 con la revisión final, hallazgos y estado. Verificación final: backend 191/191, front build OK.
- L48 (2026-11-06) Usuario: "actualiza el README dejando en claro como debe inicializar el proyecto alguien que nunca lo inicializó". README reescrito: inicio rápido, requisitos, instalación paso a paso (repo, base vía rama de Neon, backend/.env con plantilla, frontend/.env, verificación), primeros pasos (ADMIN, métodos de pago, roles), Mercado Pago, tests, problemas frecuentes, referencia técnica y limitaciones. Datos verificados contra el código (TRANSICIONES de ordenService, cors.js, env.js, workflow).
- L49 (2026-11-06) Usuario pidió: (1) que los compañeros vean los mismos datos, (2) carrusel con todos los productos en el inicio, (3) README siempre actualizado. Hecho: README paso 2 reescrito (base compartida del equipo vía DATABASE_URL por canal privado, MP TEST token, cuenta admin de prueba; rama de Neon para pruebas destructivas); ProductCatalog prop `carousel` (scroll-snap, flechas accesibles, 4/3/2 columnas, prefers-reduced-motion) usado en HomeView sin límite; vite build OK. Regla README guardada en memoria y en e-commerce/CLAUDE.md.
