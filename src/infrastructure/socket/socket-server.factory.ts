import { Server as HttpServer } from "node:http";
import { Server as SocketIoServer, ServerOptions } from "socket.io";

export class SocketServerFactory {
  public static create(httpServer: HttpServer, customOptions?: Partial<ServerOptions>): SocketIoServer {
    const defaultOptions: Partial<ServerOptions> = {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 25000,
      transports: ["websocket", "polling"],
    };

    return new SocketIoServer(httpServer, {
      ...defaultOptions,
      ...customOptions,
    });
  }
}

