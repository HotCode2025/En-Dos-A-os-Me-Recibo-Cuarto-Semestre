# Estructura del Proyecto Backend

```text
backend/
├── src/
│   ├── config/             # Configuración global (Base de datos, variables de entorno)
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/        # Manejan req, res y llamadas a servicios
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   └── productController.js
│   ├── middlewares/        # Validaciones, JWT, manejo de errores
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/             # Consultas SQL o Esquemas de BD
│   │   ├── Cart.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/             # Definición de endpoints de la API
│   │   ├── index.js        # Enrutador principal (/api/v1)
│   │   ├── authRoutes.js
│   │   ├── cartRoutes.js
│   │   └── productRoutes.js
│   ├── services/           # Lógica de negocio (Cálculos, llamadas a pagos, etc.)
│   │   ├── cartService.js
│   │   └── productService.js
│   ├── utils/              # Funciones auxiliares (formateadores, helpers)
│   │   └── jwt.js
│   └── app.js              # Inicialización de Express y middlewares
├── .env                    # Variables de entorno (DB_HOST, JWT_SECRET, PORT)
├── index.js                # Punto de entrada para arrancar el servidor
└── package.json
```

## Descripción de Componentes

- **`src/config/`**: Contiene la configuración global del proyecto, como conexiones a bases de datos y la lectura de variables de entorno.
- **`src/controllers/`**: Recibe las solicitudes HTTP (`req`), interactúa con los servicios correspondientes y retorna las respuestas (`res`).
- **`src/middlewares/`**: Funciones intermedias para autenticación JWT, control de roles de usuario y captura de errores globales.
- **`src/models/`**: Define los modelos de datos, consultas SQL o esquemas (ej. Mongoose / Sequelize / Knex).
- **`src/routes/`**: Define los endpoints de la API RESTful y los asocia con sus respectivos controladores y middlewares.
- **`src/services/`**: Encapsula toda la lógica de negocio (reglas, integraciones externas, transacciones complejas).
- **`src/utils/`**: Funciones auxiliares reutilizables, como la generación y verificación de tokens JWT o helpers de formato.
- **`src/app.js`**: Configura la instancia principal de Express, registra middlewares globales y rutas.
- **`index.js`**: Punto de entrada de la aplicación que inicia el servidor HTTP.