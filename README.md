# Servidor Intermediario Meta WhatsApp -> Electron (`rd-api`)

Servidor ligero y desacoplado desarrollado en **Node.js**, **Express** y **TypeScript**, diseñado para desplegarse en [Render](https://render.com) en `https://libreriard-q12e.onrender.com`.

Actúa como puente entre los **Webhooks de Meta WhatsApp Cloud API** y una aplicación de escritorio desarrollada en **Electron**, retransmitiendo mensajes y eventos en tiempo real a través de un WebSocket autenticado con Socket.IO.

---

## 🏛️ Arquitectura y Patrones de Diseño

El proyecto implementa una arquitectura modular de alta cohesión y bajo acoplamiento respetando **Single Responsibility Principle (SRP)** con un límite estricto de ~100 líneas por archivo:

### 1. Patrones PEAA (Patterns of Enterprise Application Architecture)
- **Repository Pattern:** `IApiKeyRepository`, `MongoApiKeyRepository` e `InMemoryApiKeyRepository` para aislar el dominio de la persistencia.
- **Service Layer:** `AuthService`, `HealthService` y `WebhookService` encapsulan los casos de uso del negocio.
- **Gateway Pattern:** `DatabaseConnection` administra el acceso y estado de MongoDB con reconexión y health checks.

### 2. Patrones GOF (Gang of Four)
- **Observer / Publisher-Subscriber:** `NodeEventBus` desacopla la recepción HTTP de los webhooks de la distribución hacia los WebSockets.
- **Strategy Pattern:** `IAuthStrategy` y `ApiKeyStrategy` permiten validar credenciales mediante tokens maestros o claves almacenadas en MongoDB.
- **Adapter Pattern:** `MetaWebhookAdapter` traduce los payloads anidados y complejos de Meta en eventos normalizados de dominio (`IncomingMessageEvent` y `MessageStatusEvent`).
- **Factory Pattern:** `SocketServerFactory` y `ExpressAppFactory` centralizan la construcción y configuración de la infraestructura.
- **Singleton Pattern:** `DatabaseConnection` provee una única instancia de conexión activa a MongoDB.

### 3. Patrones POSAD (Pattern-Oriented Software Architecture)
- **Layered Architecture:** Estricta separación en 4 capas:
  1. `domain/`: Entidades, interfaces, eventos y tipos puros.
  2. `infrastructure/`: Base de datos (Mongoose), Socket.IO, adaptadores y EventBus.
  3. `application/`: Servicios de aplicación y estrategias.
  4. `presentation/`: Controladores, middlewares, routers y Express factory.
- **Pipes and Filters:** Expresado en la tubería de middlewares de Express (`cors` -> `json` -> `auth` -> `routes` -> `error-handler`).

---

## 🚀 Despliegue en Render

Configuración recomendada para Render (Web Service):

- **Environment:** Node
- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start:prod` (o `pnpm start`)
- **Health Check Path:** `/health`
- **Auto Deploy:** Yes

### Variables de Entorno en Render
Configurar en la sección **Environment**:
| Variable | Descripción |
|---|---|
| `PORT` | 10000 (o asignado automáticamente por Render) |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Cadena de conexión a MongoDB Atlas |
| `WEBHOOK_VERIFY_TOKEN` | Token para validar el webhook en Meta Developers |
| `SERVER_API_KEY` | Clave secreta para que la app de Electron se conecte al WebSocket |
| `META_TOKEN` | Token de acceso a Meta Graph API |

---

## 🛠️ Instalación y Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Iniciar en modo desarrollo con recarga automática
pnpm dev

# Ejecutar suite completa de tests
pnpm test

# Compilar proyecto a JavaScript
pnpm build

# Ejecutar script de prueba para envío de plantilla WhatsApp
pnpm run send
```

---

## 📋 Endpoints Principales

- `GET /health` - Chequeo de salud del servicio, MongoDB y clientes socket conectados.
- `GET /webhook` - Validación de suscripción del Webhook de Meta.
- `POST /webhook` - Recepción de eventos de WhatsApp y retransmisión a WebSocket.
- `POST /api/auth/client-key` - Generación de nuevas claves de cliente para terminales Electron (requiere auth).
- `GET /api/auth/validate` - Verificación de credenciales (requiere auth).

> 💡 **Para la integración de la app en Electron**, consultar la guía técnica completa en [SERVER.md](file:///c:/Users/deget/Proyectos/rd-api/SERVER.md).

