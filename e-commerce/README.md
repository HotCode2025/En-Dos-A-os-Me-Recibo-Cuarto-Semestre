# E-commerce PuntoZero

Tienda online de productos electrónicos: catálogo con búsqueda y filtros, carrito, checkout con Mercado Pago, perfil de cliente, historial de órdenes y panel de administración. El frontend está hecho en **Vue 3 + Vite** y el backend en **Node.js + Express 5**, sobre **PostgreSQL**.

Esta guía explica cómo levantar el proyecto desde cero en una máquina nueva.

---

## Índice

1. [Inicio rápido](#inicio-rápido)
2. [Requisitos](#requisitos)
3. [Instalación paso a paso](#instalación-paso-a-paso)
4. [Primeros pasos dentro de la aplicación](#primeros-pasos-dentro-de-la-aplicación)
5. [Pagos con Mercado Pago](#pagos-con-mercado-pago)
6. [Tests](#tests)
7. [Problemas frecuentes](#problemas-frecuentes)
8. [Referencia técnica](#referencia-técnica)
9. [Limitaciones conocidas](#limitaciones-conocidas)

---

## Inicio rápido

Resumen para quien ya tiene Node.js y una base de datos lista. El detalle de cada paso está en [Instalación paso a paso](#instalación-paso-a-paso).

```bash
git clone https://github.com/HotCode2025/En-Dos-A-os-Me-Recibo-Cuarto-Semestre.git
cd En-Dos-A-os-Me-Recibo-Cuarto-Semestre/e-commerce

# Terminal 1: backend (http://localhost:3001)
cd backend
npm install
# crear backend/.env (ver paso 3.2)
npm run dev

# Terminal 2: frontend (http://localhost:5173)
cd frontend
npm install
# crear frontend/.env (ver paso 4.2)
npm run dev
```

Después, abrir `http://localhost:5173` en el navegador.

---

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20.19 o superior (recomendado: 22 LTS) | Ejecutar el backend y el frontend |
| npm | El que viene con Node.js | Instalar dependencias |
| Git | Cualquier versión reciente | Clonar el repositorio |
| Base PostgreSQL | 14 o superior | Datos de la tienda. El proyecto usa [Neon](https://neon.tech) |
| Cuenta de Mercado Pago Developers | — | Solo para probar pagos (opcional) |

Comprobar las instalaciones:

```bash
node --version   # debe mostrar v20.19 o superior
npm --version
git --version
```

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/HotCode2025/En-Dos-A-os-Me-Recibo-Cuarto-Semestre.git
cd En-Dos-A-os-Me-Recibo-Cuarto-Semestre/e-commerce
```

> El repositorio contiene varios proyectos de la cursada. El e-commerce vive en la carpeta `e-commerce/`, y **todos los comandos de esta guía se ejecutan desde ahí**.

### 2. Conseguir los datos del equipo

El repositorio **no incluye la base de datos ni las credenciales**. Los productos, usuarios, órdenes y métodos de pago viven en una base PostgreSQL en Neon que comparte todo el equipo. Conectándose a esa misma base, la aplicación muestra exactamente los mismos datos en todas las computadoras.

**Pedirle a quien administra el proyecto, por un canal privado** (mensaje directo, no el grupo ni el repositorio):

| Dato | Para qué | Dónde va |
|---|---|---|
| `DATABASE_URL` | Conectarse a la base del equipo y ver los mismos datos | `backend/.env` |
| `MP_ACCESS_TOKEN` (de prueba, `TEST-...`) | Probar pagos con Mercado Pago | `backend/.env` |
| Una cuenta de administrador de prueba | Entrar al panel de **Administración** | Se usa al iniciar sesión en la web |

El `JWT_SECRET` no hace falta pedirlo: cada integrante puede generar el suyo (ver paso 3.2).

> **Base compartida:** todo lo que se cree, edite o borre (productos, órdenes, stock, usuarios) lo ven también los demás integrantes. Para hacer pruebas destructivas sin afectar al equipo, crear una copia aislada: en el panel de Neon, **Branches → New branch** con la rama principal como padre, copiar su connection string desde **Connect** y usarla como `DATABASE_URL`. Al crearla, **desactivar el auto-borrado** si no se quiere que se elimine sola.

> **Seguridad:** el `DATABASE_URL` da acceso completo a la base. No subirlo al repositorio ni compartirlo en capturas o chats grupales. Si se filtra, regenerar la contraseña del rol desde el panel de Neon y avisar al equipo.

### 3. Configurar y levantar el backend

#### 3.1 Instalar dependencias

```bash
cd backend
npm install
```

#### 3.2 Crear el archivo `backend/.env`

Crear el archivo `backend/.env` con este contenido y completar los valores:

```env
# --- Obligatorias ---
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST/BASE?sslmode=verify-full
JWT_SECRET=reemplazar_por_una_clave_larga_y_aleatoria

# --- Servidor ---
PORT=3001
FRONTEND_URL=http://localhost:5173

# --- Mercado Pago (opcional: sin esto, los pagos responden 503) ---
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxx
BACKEND_PUBLIC_URL=
MP_WEBHOOK_SECRET=
```

Para generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

<details>
<summary><strong>Referencia completa de variables del backend</strong></summary>

| Variable | ¿Obligatoria? | Valor por defecto | Descripción |
|---|:---:|---|---|
| `DATABASE_URL` | **Sí** | — | Conexión a PostgreSQL. Si contiene `localhost`, se desactiva SSL |
| `JWT_SECRET` | **Sí** | — | Clave con la que se firman los tokens de sesión |
| `PORT` | No | `3001` | Puerto del servidor |
| `FRONTEND_URL` | No | `http://localhost:5173` | A dónde vuelve el comprador después de pagar en Mercado Pago. También se agrega a los orígenes CORS permitidos |
| `CORS_ORIGIN` | No | `http://localhost:5173`, `http://localhost:3000` | Orígenes permitidos, separados por coma |
| `MP_ACCESS_TOKEN` | Para pagar | — | Access token de Mercado Pago. En desarrollo, usar las **credenciales de prueba** (`TEST-...`) |
| `BACKEND_PUBLIC_URL` | No | — | URL pública del backend. Si está definida, Mercado Pago notifica los pagos al webhook |
| `MP_WEBHOOK_SECRET` | No | — | Clave para validar la firma de los webhooks de Mercado Pago |
| `STOCK_AL_PAGAR_DESDE` | No | — | Fecha ISO (`2026-11-06`). Solo las órdenes posteriores reponen stock al cancelarse ya pagadas |

Si falta `DATABASE_URL` o `JWT_SECRET`, el servidor **no arranca** e indica qué variable falta.

</details>

#### 3.3 Verificar la base (recomendado)

```bash
node src/config/initDb.js
```

Este script comprueba que existan las tablas y columnas que usa la aplicación. **No crea ni modifica nada.** Si informa faltantes, la base no corresponde a este proyecto.

#### 3.4 Levantar el servidor

```bash
npm run dev     # con recarga automática al guardar cambios
# o bien
npm start       # sin recarga automática
```

Debe aparecer `Servidor escuchando en http://localhost:3001`. Dejar esta terminal abierta.

### 4. Configurar y levantar el frontend

En **otra terminal**, desde `e-commerce/`:

#### 4.1 Instalar dependencias

```bash
cd frontend
npm install
```

#### 4.2 Crear el archivo `frontend/.env`

Copiar el ejemplo:

```bash
cp .env.example .env          # macOS / Linux / Git Bash
copy .env.example .env        # Windows (cmd o PowerShell)
```

Contenido esperado:

```env
VITE_API_BASE_URL=/api/v1
```

Con `/api/v1`, Vite redirige las llamadas al backend local (`http://localhost:3001`) mediante su proxy, así que no hace falta configurar CORS en desarrollo.

> Vite lee el `.env` **solo al iniciar**. Si se modifica, hay que detener (`Ctrl+C`) y volver a ejecutar `npm run dev`.

#### 4.3 Levantar el frontend

```bash
npm run dev
```

Abrir la dirección que muestra la terminal, normalmente `http://localhost:5173`.

### 5. Comprobar que todo funciona

| Comprobación | Resultado esperado |
|---|---|
| `http://localhost:3001/` | Mensaje indicando que Express está funcionando |
| `http://localhost:3001/test-db` | Confirmación de conexión con PostgreSQL |
| `http://localhost:3001/api/v1/productos` | Catálogo en formato JSON |
| `http://localhost:5173` | La tienda carga con productos |

Si algo falla, ver [Problemas frecuentes](#problemas-frecuentes).

---

## Primeros pasos dentro de la aplicación

### Crear una cuenta

Ingresar a **Crear cuenta** (`/registro`). Por seguridad, todas las cuentas nuevas se crean con rol `CLIENTE`.

### Convertir una cuenta en administrador

El rol de administrador se asigna directamente en la base de datos:

```sql
UPDATE usuario SET rol = 'ADMIN' WHERE LOWER(email) = 'correo@ejemplo.com';
```

Después **cerrar sesión y volver a ingresar**: el rol viaja dentro del token de sesión, que se genera al iniciar sesión. Desde ese momento aparece el enlace **Administración** en el encabezado.

### Habilitar métodos de pago

El checkout solo muestra los métodos de pago **activos**. Se gestionan desde **Administración → Métodos de pago**, o por SQL:

```sql
INSERT INTO metodo_pago (nombre, descripcion, instrucciones, activo) VALUES
  ('Mercado Pago', 'Pago online con Mercado Pago', NULL, true),
  ('Efectivo', 'Pago en el local', 'Abonar al retirar el pedido.', true);
```

> Un método cuyo nombre contiene **"Mercado Pago"** o **"Tarjeta"** redirige a Mercado Pago. El resto muestra las instrucciones de pago y la orden queda `Pendiente` hasta que un administrador la marque como `Pagado`.

### Qué puede hacer cada rol

| Rol | Funcionalidades |
|---|---|
| Visitante | Ver el catálogo (en el inicio, un carrusel con todos los productos, primero los destacados), buscar, filtrar y armar un carrito que se conserva al iniciar sesión |
| Cliente | Comprar, ver **Mis órdenes**, editar **Mi perfil** |
| Administrador | Además: alta, edición y baja de productos; gestionar órdenes, estados, métodos de pago, inventario y usuarios |

---

## Pagos con Mercado Pago

### Configuración para pruebas

1. Ingresar a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers) y crear una aplicación.
2. En **Credenciales de prueba**, copiar el *Access Token* (empieza con `TEST-`) en `MP_ACCESS_TOKEN` del `backend/.env`.
3. Reiniciar el backend.
4. Para pagar, usar las tarjetas y usuarios de prueba que provee Mercado Pago en su documentación.

> **Nunca usar credenciales de producción (`APP_USR-...`) en desarrollo**, ni subirlas al repositorio.

### Cómo se confirma un pago

Una orden pasa de `Pendiente` a `Pagado` por cualquiera de estos tres caminos. Los tres validan el monto y son idempotentes, así que repetirlos no tiene efecto.

| Camino | Cuándo ocurre | Requisito |
|---|---|---|
| **Webhook** | Mercado Pago avisa al backend apenas se acredita el pago | `BACKEND_PUBLIC_URL` con una URL pública |
| **Retorno al sitio** | El comprador vuelve a la tienda desde Mercado Pago | `FRONTEND_URL` con una URL pública |
| **Conciliación activa** | Al iniciar sesión, al abrir **Mis órdenes** o con **Verificar pago** en el panel de administración | Ninguno: funciona también en local |

Al pasar a `Pagado` se descuenta el stock. Si un administrador cancela una orden ya pagada, el stock se repone y el pago se reembolsa automáticamente en Mercado Pago.

### Desarrollo en `localhost`

Mercado Pago **no acepta direcciones locales** como URL de retorno. En local:

- No hay redirección automática ni botón "Volver al sitio": después de pagar, volver a abrir la tienda manualmente.
- El estado de la orden se actualiza solo por **conciliación activa**, al iniciar sesión o al abrir **Mis órdenes**.
- Para probar la redirección completa, exponer el frontend con un túnel (por ejemplo [ngrok](https://ngrok.com/)) y usar esa URL en `FRONTEND_URL`.

---

## Tests

```bash
cd backend
npm test
```

Usa el runner nativo de Node.js (`node --test`). Los tests reemplazan la base de datos y Mercado Pago por dobles en memoria: **no necesitan conexión ni variables de entorno** y no modifican datos reales.

El repositorio incluye un workflow de GitHub Actions (`.github/workflows/e-commerce.yml`, en la raíz del repositorio) que ejecuta estos tests en cada push o pull request que modifique `e-commerce/`.

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Faltan variables de entorno obligatorias: ...` al iniciar el backend | Falta `backend/.env` o le falta una variable | Revisar el [paso 3.2](#32-crear-el-archivo-backendenv) |
| `EADDRINUSE: address already in use :::3001` | Ya hay otro proceso en ese puerto (por ejemplo, otra terminal con el backend) | Cerrar el otro proceso o cambiar `PORT` (y el `target` de `frontend/vite.config.js`) |
| La tienda muestra "No se pudo conectar con el servidor" | El backend no está corriendo, o el frontend apunta a otro puerto | Verificar que el backend esté levantado en `3001` y que `frontend/.env` tenga `VITE_API_BASE_URL=/api/v1` |
| Cambié `frontend/.env` y no tuvo efecto | Vite lee el `.env` solo al iniciar | Reiniciar `npm run dev` del frontend |
| Error de CORS en la consola del navegador | Se usa una URL absoluta en `VITE_API_BASE_URL` con un origen no permitido | Usar `/api/v1`, o agregar el origen en `CORS_ORIGIN` |
| `/test-db` falla o el catálogo da error 500 | `DATABASE_URL` incorrecta o base sin el esquema | Revisar la URL y ejecutar `node src/config/initDb.js` |
| Los pagos responden 503 | Falta `MP_ACCESS_TOKEN` | Configurarlo y reiniciar el backend |
| Después de pagar, la orden sigue `Pendiente` | En local no llegan ni el webhook ni el retorno | Iniciar sesión de nuevo o abrir **Mis órdenes** (conciliación activa) |
| Promoví una cuenta a `ADMIN` y no veo el panel | El token actual tiene el rol anterior | Cerrar sesión y volver a ingresar |
| "Credenciales incorrectas" con datos correctos | El email tiene espacios o la cuenta pertenece a otra base | Verificar el email y que `DATABASE_URL` apunte a la base esperada |

---

## Referencia técnica

### Stack

| Capa | Tecnologías |
|---|---|
| Frontend | Vue 3, Vue Router 4, Vite |
| Backend | Node.js, Express 5, `pg`, `jsonwebtoken`, `bcryptjs`, `express-validator`, `cors`, `dotenv` |
| Pagos | SDK oficial `mercadopago` (Checkout Pro) |
| Base de datos | PostgreSQL (Neon) |
| Tests | `node --test` (runner nativo) |
| Deploy | Backend en Render: `https://ecommerce-backend-21u2.onrender.com` |

### Estructura de carpetas

```text
e-commerce/
├── backend/
│   ├── index.js                 # Punto de entrada: valida el entorno y levanta el servidor
│   ├── estructura-carpetas.md   # Detalle interno del backend
│   ├── test/                    # Tests (node --test)
│   └── src/
│       ├── app.js               # Express, CORS, rutas, 404 y manejador de errores
│       ├── config/              # Base de datos, entorno, CORS y Mercado Pago
│       ├── routes/              # Endpoints de la API (montados en routes/api.js)
│       ├── controllers/         # Capa HTTP: request y response
│       ├── services/            # Reglas de negocio
│       ├── models/              # Consultas SQL
│       ├── middlewares/         # Autenticación JWT, roles, validaciones y errores
│       └── utils/               # Utilidades: JWT, hash, errores HTTP, normalización
└── frontend/
    ├── vite.config.js           # Proxy de /api hacia http://localhost:3001
    └── src/
        ├── main.js · router.js · App.vue
        ├── services/            # Cliente HTTP (api.js) y servicios por recurso
        ├── stores/auth.js       # Sesión del usuario
        ├── utils/               # Formatos, avisos y redirecciones seguras
        ├── components/          # ProductCatalog.vue
        └── views/               # Páginas públicas, cuenta del cliente y admin/
```

### Arquitectura

```text
Vue (vistas) → services/*.js → apiRequest()  ── Authorization: Bearer <JWT>
        │
        ▼  /api/v1  (proxy de Vite en desarrollo)
Express → verificarToken → permitRoles → controller → service → model → PostgreSQL
                                                         └→ Mercado Pago
```

- **Errores:** todas las respuestas de error tienen la forma `{ "error": "mensaje" }`.
- **401:** sesión ausente o vencida. El frontend cierra la sesión y redirige al login.
- **403:** el usuario no tiene permisos para esa acción.
- **Sesión:** el token vence a las 2 horas y se guarda en `sessionStorage`, así que cada pestaña tiene su propia sesión.

### Endpoints principales (`/api/v1`)

| Recurso | Método y ruta | Acceso |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` | Público |
| Productos | `GET /productos` | Público |
| | `GET /productos/opciones`, `POST /productos`, `PUT /productos/:id`, `DELETE /productos/:id` | ADMIN |
| Inventario | `GET /inventario`, `GET /inventario/:id` | Público |
| | `PUT /inventario/:id/stock` | ADMIN |
| Usuarios | `GET /usuarios/perfil`, `PUT /usuarios/perfil` | Autenticado |
| | `GET /usuarios` | ADMIN |
| Carrito | `GET /carrito`, `POST /carrito/agregar`, `PUT /carrito/restar`, `DELETE /carrito/quitar/:productoId` | Autenticado |
| Órdenes | `POST /ordenes`, `GET /ordenes/mis-ordenes` | CLIENTE / ADMIN |
| | `GET /ordenes`, `PUT /ordenes/:id/estado` | ADMIN |
| Métodos de pago | `GET /metodos-pago` (solo activos) | Público |
| | `GET /metodos-pago/:id` | CLIENTE / ADMIN |
| | `GET /metodos-pago/admin`, `POST /metodos-pago`, `PUT /metodos-pago/:id`, `DELETE /metodos-pago/:id` | ADMIN |
| Pagos | `POST /pagos/crear-preferencia`, `POST /pagos/confirmar` | Autenticado |
| | `POST /pagos/sincronizar/:ordenId`, `POST /pagos/sincronizar-pendientes` | Autenticado (el ADMIN puede sincronizar cualquier orden) |
| | `POST /pagos/webhook` | Mercado Pago |

Las rutas protegidas requieren el encabezado `Authorization: Bearer <token>`, que se obtiene en `/auth/login`.

### Estados de una orden

```text
Pendiente ──► Pagado ──► Enviado ──► Entregado
    │            │
    └──► Cancelado ◄┘   (cancelar una orden pagada repone stock y reembolsa)
```

El stock **no se reserva** al crear la orden: se descuenta cuando la orden pasa a `Pagado`.

### Base de datos

Tablas que usa la aplicación: `usuario`, `producto`, `marca`, `categorias`, `carrito`, `item_carrito`, `metodo_pago`, `orden`, `detalle_orden` y `valoracion`. La lista exacta de columnas está en `backend/src/config/initDb.js`.

El email de usuario es único sin distinguir mayúsculas. En la base se garantiza con:

```sql
CREATE UNIQUE INDEX usuario_email_unico ON usuario (LOWER(email));
```

---

## Limitaciones conocidas

| Limitación | Detalle |
|---|---|
| Sin script de creación de la base | El esquema y los datos se mantienen directamente en Neon. Para un entorno nuevo, usar la base del equipo o una rama de Neon ([paso 2](#2-conseguir-los-datos-del-equipo)) |
| Sin recuperación de contraseña | Quien la olvida debe pedirle el cambio al administrador |
| Mercado Pago en `localhost` | No hay redirección ni webhook; las órdenes se actualizan por conciliación activa |
| Método de pago detectado por nombre | Se decide si un método usa Mercado Pago según su nombre ("Mercado Pago" o "Tarjeta"). Renombrarlo cambia el comportamiento |
| Sin paginación | El catálogo y los listados se devuelven completos |
| Sin límite de intentos | `/auth/login` y `/auth/register` no tienen rate limiting |
| Sin envío de emails | No hay confirmaciones de compra por correo |

La auditoría técnica completa y el historial de decisiones están en [`auditoria.md`](auditoria.md).
