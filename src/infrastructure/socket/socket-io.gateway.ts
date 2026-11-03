import { Server as SocketIoServer, Socket } from "socket.io";
import { ISocketGateway } from "../../domain/interfaces/socket-gateway.interface.js";
import { IAuthStrategy } from "../../domain/interfaces/auth-strategy.interface.js";
import { IEventBus } from "../../domain/interfaces/event-bus.interface.js";

export class SocketIoGateway implements ISocketGateway {
  private io: SocketIoServer;
  private authStrategy: IAuthStrategy;
  private eventBus: IEventBus;
  private connectedSockets: Map<string, Socket> = new Map();

  constructor(io: SocketIoServer, authStrategy: IAuthStrategy, eventBus: IEventBus) {
    this.io = io;
    this.authStrategy = authStrategy;
    this.eventBus = eventBus;
    this.configureAuthMiddleware();
    this.configureConnectionHandling();
    this.bindDomainEvents();
  }

  public broadcast<T>(event: string, payload: T): void {
    this.io.emit(event, payload);
  }

  public getConnectedClientsCount(): number {
    return this.connectedSockets.size;
  }

  public async close(): Promise<void> {
    await this.io.close();
  }

  private configureAuthMiddleware(): void {
    this.io.use(async (socket, next) => {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.auth?.apiKey ||
        socket.handshake.headers["x-api-key"] ||
        socket.handshake.headers["authorization"]?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Authentication failed: Missing token or API key"));
      }

      const entity = await this.authStrategy.authenticate(String(token));
      if (!entity) {
        return next(new Error("Authentication failed: Invalid credentials"));
      }

      socket.data = { client: entity };
      next();
    });
  }

  private configureConnectionHandling(): void {
    this.io.on("connection", (socket: Socket) => {
      this.connectedSockets.set(socket.id, socket);
      console.log(`[Socket] Client connected: ${socket.id} (${socket.data.client?.clientName})`);

      socket.on("disconnect", () => {
        this.connectedSockets.delete(socket.id);
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });
  }

  private bindDomainEvents(): void {
    this.eventBus.subscribe("webhook:raw", (payload) => {
      this.broadcast("whatsapp:webhook", payload);
    });
    this.eventBus.subscribe("webhook:message", (message) => {
      this.broadcast("whatsapp:message", message);
    });
    this.eventBus.subscribe("webhook:status", (status) => {
      this.broadcast("whatsapp:status", status);
    });
  }
}

