# 🧑‍🍳 Bite&Go User Service (`Bite-go-user`)

API pública para clientes de la plataforma Bite&Go. Gestiona restaurantes, menú, pedidos, reservas, reseñas, notificaciones y más.

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT_HS256-000000?logo=jsonwebtokens)

---

## 📋 Descripción

Microservicio Node.js que expone la API pública para los clientes de Bite&Go. Los endpoints son consumidos tanto por el frontend web (`client-user-bite-go`) como por la app mobile (`client-user-mobile-bite-go`). La autenticación se realiza mediante JWT emitidos por el `auth-service` (.NET).

---

## 🏗️ Arquitectura

```
Bite-go-user/
├── configs/                      # Configuración del servidor
│   ├── app.js                    # Express setup, middleware, routes, server init
│   ├── db.js                     # Conexión MongoDB + graceful shutdown
│   ├── cors-configuration.js     # CORS (ALLOWED_ORIGIN)
│   └── helmet-configuration.js   # Seguridad HTTP headers
│
├── middlewares/                  # 16 middlewares
│   ├── validate-jwt.js           # Verifica JWT del auth-service .NET
│   ├── validate-roles.js         # Control de acceso por rol
│   ├── check-validators.js       # express-validator result checker
│   ├── handle-errors.js          # Error handler global
│   ├── request-limit.js          # Rate limiter (10k req/15min)
│   ├── file-uploader.js          # Multer + Cloudinary
│   ├── delete-file-on-error.js   # Cleanup Cloudinary en error
│   ├── order-validator.js        # Validación creación/actualización pedidos
│   ├── order-logic-validators.js # Lógica de asignación mesero/repartidor
│   ├── validate-order-status.js  # Bloquea edición en estados finalizados
│   ├── reservations-validator.js # Validación reservas
│   ├── restaurants-validator.js  # Validación restaurantes/eventos
│   ├── reviewsRatings-validator.js
│   ├── categories-validator.js
│   ├── inventory-validators.js
│   └── recipes-validator.js
│
├── src/                          # Módulos de la aplicación
│   ├── users/                    # Perfil, favoritos, direcciones, foto
│   ├── restaurants/              # Información pública de restaurantes
│   ├── orders/                   # Pedidos del cliente
│   ├── reservations/             # Reservas de mesas
│   ├── products/                 # Menú y productos
│   ├── categories/               # Categorías de productos
│   ├── coupons/                  # Validación de cupones
│   ├── notifications/            # Notificaciones del usuario
│   ├── reviewsRatings/           # Reseñas y calificaciones
│   ├── items/                    # Items dentro de pedidos
│   └── gastronomicEvents/        # Eventos del restaurante
│
├── index.js                      # Entry point
├── Dockerfile                    # node:18-alpine
└── .env.example                  # Template de variables de entorno
```

---

## ⚙️ Stack

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| `express` | ^5.2.1 | Framework HTTP |
| `mongoose` | ^9.2.1 | ODM MongoDB |
| `jsonwebtoken` | ^9.0.3 | Validación JWT |
| `express-validator` | ^7.3.1 | Validación de requests |
| `cors` | ^2.8.6 | CORS |
| `helmet` | ^8.1.0 | Seguridad headers |
| `morgan` | ^1.10.1 | Logging HTTP |
| `dotenv` | ^17.3.1 | Variables de entorno |
| `express-rate-limit` | ^8.2.1 | Rate limiting |
| `multer` + `cloudinary` | — | Upload de fotos a Cloudinary |
| `swagger-jsdoc` + `swagger-ui-express` | — | Documentación API |
| `uuid` | ^13.0.0 | Generación de IDs únicos |

---

## 📡 Endpoints

Base URL: **`/bite-and-go/v1`** | Puerto: **`3001`**

### 👤 Usuarios

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| `POST` | `/users/sync` | JWT | Sincronizar/crear usuario desde JWT del auth-service |
| `GET` | `/users/me` | JWT | Obtener perfil del usuario autenticado (verify-only) |
| `POST` | `/users/register` | — | Registrar usuario directamente en MongoDB |
| `PUT` | `/users/:id` | JWT | Actualizar datos del perfil |
| `GET` | `/users/:id` | JWT | Obtener usuario por ID |
| `PUT` | `/users/profile/photo` | JWT | Subir foto de perfil (Cloudinary) |
| `DELETE` | `/users/profile/photo` | JWT | Eliminar foto de perfil |

#### ❤️ Favoritos

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| `GET` | `/users/favorites/list` | JWT | Listar restaurantes favoritos |
| `POST` | `/users/favorites/toggle` | JWT | Agregar/quitar favorito |

#### 📍 Direcciones

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| `GET` | `/users/addresses/list` | JWT | Listar direcciones guardadas |
| `POST` | `/users/addresses/add` | JWT | Agregar nueva dirección |
| `DELETE` | `/users/addresses/:id` | JWT | Eliminar dirección |

### 🏪 Restaurantes

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| `GET` | `/restaurants` | — | Listar restaurantes (paginado, filtros) |
| `GET` | `/restaurants/:id` | — | Detalle del restaurante |

### 🍽️ Productos / Menú

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| `GET` | `/products` | — | Catálogo completo de productos |
| `GET` | `/products/search?q=` | — | Búsqueda por nombre |
| `GET` | `/products/menu/:id_restaurante` | — | Menú completo de un restaurante |
| `GET` | `/products/restaurant/:id_restaurante` | — | Productos por restaurante (paginado) |
| `GET` | `/products/:id` | — | Detalle de producto |

### 📦 Pedidos

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| `GET` | `/orders/history` | JWT | Historial de pedidos del cliente |
| `GET` | `/orders/:id` | JWT | Detalle del pedido |
| `POST` | `/orders` | JWT | Crear nuevo pedido |
| `DELETE` | `/orders/:id` | JWT | Cancelar pedido (solo si está "Pendiente") |

### 🪑 Reservas

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| `GET` | `/reservations` | JWT | Mis reservas |
| `GET` | `/reservations/tables-availability` | JWT | Disponibilidad de mesas por fecha/hora |
| `POST` | `/reservations` | JWT | Crear nueva reserva (con detección de conflictos) |
| `DELETE` | `/reservations/:id` | JWT | Cancelar reserva |

### 📂 Otros

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| `GET` | `/categories?restaurante=ID` | — | Categorías por restaurante |
| `GET` | `/categories/all` | — | Todas las categorías únicas |
| `POST` | `/coupons/validate` | — | Validar código de cupón |
| `GET` | `/notifications` | JWT | Notificaciones del usuario |
| `GET` | `/notifications/unread-count` | JWT | Contador de no leídas |
| `PUT` | `/notifications/:id/read` | JWT | Marcar notificación como leída |
| `PUT` | `/notifications/read-all` | JWT | Marcar todas como leídas |
| `GET` | `/reviewsRatings` | JWT | Mis reseñas |
| `GET` | `/reviewsRatings/restaurant/:id` | — | Reseñas públicas de un restaurante |
| `POST` | `/reviewsRatings` | JWT | Crear reseña |
| `GET` | `/items/:id_order` | JWT | Items de un pedido |
| `POST` | `/items/add/:id_order` | JWT | Agregar item a pedido activo |
| `PUT` | `/items/:id_order/:id_item` | JWT | Actualizar item |
| `DELETE` | `/items/:id_order/:id_item` | JWT | Eliminar item |
| `GET` | `/gastronomicEvents/:id` | — | Eventos de un restaurante |
| `GET` | `/health` | — | Health check para Render |

---

## 🔧 Variables de Entorno

| Variable | Default | Obligatoria | Descripción |
|----------|---------|:-----------:|-------------|
| `PORT` | `3001` | ✅ | Puerto del servidor |
| `URL_MONGODB` | — | ✅ | Conexión a MongoDB |
| `JWT_SECRET` | — | ✅ | Mismo que auth-service |
| `JWT_ISSUER` | `BiteGoAuthService` | ✅ | Mismo que auth-service |
| `JWT_AUDIENCE` | `BiteGoServices` | ✅ | Mismo que auth-service |
| `AUTH_SERVICE_URL` | — | ✅ | URL del auth-service |
| `ADMIN_SERVICE_URL` | `http://admin-service:3002` | ✅ | URL del admin-service (inter-servicio: inventario) |
| `INTER_SERVICE_SECRET` | — | ✅ | Secret compartido con admin-service para `/inventory/*` |
| `ALLOWED_ORIGIN` | `*` | — | Orígenes CORS permitidos |
| `RATE_LIMIT_MAX` | `10000` | — | Máx requests por ventana |
| `CLOUDINARY_CLOUD_NAME` | — | ✅ | Cloud name |
| `CLOUDINARY_API_KEY` | — | ✅ | API Key |
| `CLOUDINARY_API_SECRET` | — | ✅ | API Secret |

---

## 🚀 Inicio Rápido

### Local

```bash
# 1. Clonar e instalar
cd Bite-go-user
cp .env.example .env

# 2. Editar .env — valores requeridos:
#    URL_MONGODB=mongodb://localhost:27017/BiteGoDB
#    JWT_SECRET=<mismo que auth-service>
#    CLOUDINARY_*=<credenciales>

# 3. Iniciar
npm install
npm run dev    # nodemon con autoreload
npm start      # producción
```

### Docker

```bash
# Desde la raíz del monorepo:
docker compose up --build user-service

# O desde este directorio (requiere MongoDB y auth corriendo):
docker build -t bitego-user .
docker run -p 3001:3001 --env-file .env bitego-user
```

---

## 🚢 Despliegue (Render)

```yaml
# Render Dashboard:
# - Runtime: Docker
# - Build Command: (usar Dockerfile)
# - Start Command: npm start
# - Health Check Path: /health
# - Puerto: 3001
# - Environment Variables: todas las del .env
```

---

## ❓ Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| `401` en endpoints | Token inválido o expirado | Verificar JWT_SECRET coincide con auth-service |
| `ECONNREFUSED` MongoDB | MongoDB no corriendo | `docker compose up mongodb` |
| `MulterError: File too large` | Foto >5MB | Redimensionar antes de subir |
| `11000 duplicate key` | Email o auth_id duplicado | Verificar que el usuario no exista |
