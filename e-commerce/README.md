# E-commerce

Proyecto de concesionaria online con un backend en Node.js y Express y un frontend en Vue 3 + Vite. El frontend presenta autos de muestra de marcas disponibles en el mercado argentino, permite filtrar por marca y guardar vehículos en una lista de reservas.

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
- `http://localhost:5173` muestra la tienda.

## Estado actual del catálogo y las reservas

El frontend incluye autos de muestra, búsqueda por marca/modelo/año, filtros por marca y una lista local de reservas. Las reservas son una demostración: no se envía una solicitud real, no se confirma disponibilidad ni se procesa ningún pago. Los precios, kilómetros y demás datos mostrados son orientativos y deben confirmarse con la concesionaria. El catálogo y las reservas todavía no están conectados al backend ni se guardan en la base de datos.


## Estructura

```text
e-commerce/
├── backend/     # API Express y conexión PostgreSQL
└── frontend/    # Tienda Vue 3 + Vite
```
