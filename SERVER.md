# SERVER.md - Especificación Técnica de Integración para App Electron

> **Destinatario:** Desarrollador o Agente de IA de la aplicación Electron.  
> **Propósito:** Guía completa para autenticarse, conectarse al WebSocket y consumir eventos de WhatsApp en tiempo real.

---

## 1. Información General del Servidor

- **Producción (Render):** `https://libreriard-q12e.onrender.com`
- **WebSocket URL (Producción):** `wss://libreriard-q12e.onrender.com`
- **Desarrollo Local:** `http://localhost:3000`
- **Protocolo WebSocket:** Socket.IO v4 (`transports: ["websocket", "polling"]`)

---

## 2. Autenticación

El servidor requiere autenticación para la conexión WebSocket y los endpoints protegidos.

### 2.1 Credenciales
- Utiliza la clave de API configurada en el cliente.
- Clave de entorno por defecto / master: `SERVER_API_KEY` (o la clave generada para el cliente con formato `rd_...`).

### 2.2 Autenticación en WebSocket (Socket.IO)
En el handshake inicial, debes enviar la clave en el objeto `auth`:
```typescript
{
  auth: {
    token: "<TU_API_KEY>"
  }
}
```
*(También se acepta en `auth.apiKey` o en cabeceras `x-api-key`)*.

### 2.3 Autenticación en Endpoints REST
- Cabecera: `x-api-key: <TU_API_KEY>`  
- O cabecera: `Authorization: Bearer <TU_API_KEY>`

---

## 3. Endpoints REST

### 3.1 `GET /health` (Público)
Verifica el estado del servidor, base de datos y clientes WebSocket conectados.

**Respuesta Exitosa (`200 OK` o `503 Service Unavailable`):**
```json
{
  "status": "ok",
  "timestamp": "2026-11-02T23:00:00.000Z",
  "uptimeSeconds": 3600,
  "environment": "production",
  "services": {
    "database": {
      "connected": true,
      "state": "connected"
    },
    "socket": {
      "connectedClients": 1
    }
  }
}
```

### 3.2 `GET /webhook` (Meta WhatsApp Verification)
Endpoint utilizado por Meta para validar el webhook en el Meta Developer Portal.
- Parámetros query: `hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=<CHALLENGE>`
- Respuesta: `<CHALLENGE>` en texto plano.

### 3.3 `POST /webhook` (Meta Ingress)
Recibe las notificaciones de Meta en formato JSON, las procesa y las retransmite inmediatamente a los clientes conectados por WebSocket.

### 3.4 `GET /api/auth/validate` (Protegido)
Valida si la API Key es válida.

---

## 4. Eventos del WebSocket (Socket.IO)

Una vez establecida la conexión con el servidor, la aplicación Electron puede escuchar los siguientes eventos:

### 4.1 Evento: `whatsapp:message`
Emitido cuando un usuario envía un mensaje al número de WhatsApp de la librería.

**Estructura del Payload:**
```typescript
interface IncomingMessageEvent {
  messageId: string;       // ID único de mensaje de Meta (wamid.XXX)
  from: string;            // Número de teléfono del remitente (ej: "5491112345678")
  timestamp: string;       // Timestamp unix en segundos
  type: string;            // "text", "image", "audio", "document", etc.
  body?: string;           // Contenido textual del mensaje (si es de tipo text)
  raw: object;             // Objeto original completo recibido de Meta
}
```

**Ejemplo de Payload:**
```json
{
  "messageId": "wamid.HBgNNTQ5MTEzMDkyNjc3NhUCABEYEjJDOEI2OTZFMTIwQTFBMjAwQQA=",
  "from": "5491130926776",
  "timestamp": "1720000000",
  "type": "text",
  "body": "Hola, necesito consultar por un libro",
  "raw": { ... }
}
```

### 4.2 Evento: `whatsapp:status`
Emitido cuando cambia el estado de entrega de un mensaje enviado.

**Estructura del Payload:**
```typescript
interface MessageStatusEvent {
  messageId: string;       // ID único del mensaje
  recipientId: string;     // Número de teléfono del destinatario
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;       // Timestamp unix en segundos
  raw: object;             // Objeto original completo
}
```

### 4.3 Evento: `whatsapp:webhook`
Emitido con el payload sin procesar (raw) recibido directamente desde los servidores de Meta.

---

## 5. Código de Conexión para Electron

Instala el cliente de Socket.IO en tu aplicación Electron:
```bash
npm install socket.io-client
# o
pnpm add socket.io-client
```

### Implementación Lista para Copiar/Pegar (`whatsapp-client.ts`):

```typescript
import { io, Socket } from "socket.io-client";

export interface WhatsAppMessage {
  messageId: string;
  from: string;
  timestamp: string;
  type: string;
  body?: string;
  raw: unknown;
}

export interface WhatsAppStatus {
  messageId: string;
  recipientId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  raw: unknown;
}

export class WhatsAppSocketBridge {
  private socket: Socket | null = null;
  private serverUrl: string;
  private apiKey: string;

  constructor(serverUrl: string = "https://libreriard-q12e.onrender.com", apiKey: string) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
  }

  public connect(): void {
    if (this.socket) return;

    this.socket = io(this.serverUrl, {
      auth: {
        token: this.apiKey,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on("connect", () => {
      console.log(`[WhatsAppBridge] Conectado exitosamente al servidor (ID: ${this.socket?.id})`);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[WhatsAppBridge] Error de conexión / autenticación:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("[WhatsAppBridge] Desconectado del servidor:", reason);
    });

    // Escucha de mensajes entrantes
    this.socket.on("whatsapp:message", (message: WhatsAppMessage) => {
      console.log("[WhatsAppBridge] Mensaje recibido:", message);
      this.onMessageReceived(message);
    });

    // Escucha de estados de entrega (leído, entregado, enviado)
    this.socket.on("whatsapp:status", (status: WhatsAppStatus) => {
      console.log("[WhatsAppBridge] Estado actualizado:", status);
      this.onStatusReceived(status);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  protected onMessageReceived(message: WhatsAppMessage): void {
    // Sobrescribir o emitir al renderer de Electron vía IPC (ipcRenderer o webContents.send)
  }

  protected onStatusReceived(status: WhatsAppStatus): void {
    // Sobrescribir o emitir al renderer de Electron vía IPC
  }
}
```

