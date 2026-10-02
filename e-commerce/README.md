# E-commerce

Proyecto de tienda online de productos electrónicos con un backend en Node.js y Express y un frontend en Vue 3 + Vite. El frontend presenta la tienda PuntoZero con un catálogo de 20 productos de muestra, búsqueda, filtros por categoría, carrito de compras y diseño adaptable a móviles.

## Requisitos

- Node.js 20.19 o superior (o 22.12 o superior) y npm.
- Acceso a la base PostgreSQL de Neon del proyecto para probar la conexión a la base.

Podés comprobar las instalaciones con:

```powershell
node --version
npm --version
```

## Configuración inicial

Instalá las dependencias del backend y del frontend:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

### Variables de entorno del backend

Creá el archivo `backend/.env` (en la misma carpeta que `backend/index.js`) con las variables necesarias:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST/BASE?sslmode=require
PORT=3000
```

## Ejecutar el proyecto

Abrí **dos terminales** en la carpeta `e-commerce`.

En la primera, iniciá el backend:

```powershell
cd backend
npm run dev
```

El servidor queda disponible en `http://localhost:3000`. También podés iniciarlo sin reinicio automático con `npm start`.

En la segunda, iniciá el frontend:

```powershell
cd frontend
npm run dev
```

Abrí en el navegador la dirección que muestra Vite; normalmente es `http://localhost:5173`.

Para detener cualquiera de los servidores, usá `Ctrl+C` en su terminal.

## Comprobaciones

- `http://localhost:3000/` muestra un mensaje de que Express está funcionando.
- `http://localhost:3000/test-db` prueba la conexión con PostgreSQL. Requiere que `backend/.env` tenga una `DATABASE_URL` válida.
- `http://localhost:5173` muestra la página de inicio.
- `http://localhost:5173/productos` muestra el catálogo completo.

## Estado actual del catálogo y el carrito

El frontend incluye 20 productos de muestra, búsqueda por nombre/marca/categoría, filtros por categoría y un carrito compartido entre páginas con cantidades y cálculo de subtotal. Es una demostración: el catálogo y el carrito todavía no están conectados al backend, no se confirma disponibilidad ni se procesa ningún pago. Los precios y las promociones son ilustrativos.


## Estructura

```text
e-commerce/
├── backend/     # API Express y conexión PostgreSQL
└── frontend/    # Tienda Vue 3 + Vite
```
