import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, Server as HttpServer } from "node:http";
import { io as ClientSocket, Socket as ClientSocketType } from "socket.io-client";
import { ExpressAppFactory } from "../../src/presentation/express-app.factory.js";
import { HealthService } from "../../src/application/services/health.service.js";
import { HealthController } from "../../src/presentation/controllers/health.controller.js";
import { DatabaseConnection } from "../../src/infrastructure/database/database.connection.js";
import { WebhookController } from "../../src/presentation/controllers/webhook.controller.js";
import { WebhookService } from "../../src/application/services/webhook.service.js";
import { NodeEventBus } from "../../src/infrastructure/event-bus/node-event-bus.js";
import { MetaWebhookAdapter } from "../../src/infrastructure/adapters/meta-webhook.adapter.js";
import { AuthController } from "../../src/presentation/controllers/auth.controller.js";
import { AuthService } from "../../src/application/services/auth.service.js";
import { InMemoryApiKeyRepository } from "../../src/infrastructure/repositories/in-memory-api-key.repository.js";
import { ApiKeyStrategy } from "../../src/application/strategies/api-key.strategy.js";
import { AuthMiddleware } from "../../src/presentation/middlewares/auth.middleware.js";
import { SocketServerFactory } from "../../src/infrastructure/socket/socket-server.factory.js";
import { SocketIoGateway } from "../../src/infrastructure/socket/socket-io.gateway.js";

describe("Socket.io Gateway Integration", () => {
  let httpServer: HttpServer;
  let socketGateway: SocketIoGateway;
  let eventBus: NodeEventBus;
  let port: number;
  const masterKey = "socket-test-master-key";

  beforeAll(async () => {
    const repo = new InMemoryApiKeyRepository();
    const strategy = new ApiKeyStrategy(repo, masterKey);
    const authService = new AuthService(repo, strategy);
    const authController = new AuthController(authService);
    const authMiddleware = new AuthMiddleware(authService);

    const db = DatabaseConnection.getInstance();
    const healthService = new HealthService(db, undefined, "test");
    const healthController = new HealthController(healthService);

    eventBus = new NodeEventBus();
    const adapter = new MetaWebhookAdapter();
    const webhookService = new WebhookService("token", eventBus, adapter);
    const webhookController = new WebhookController(webhookService);

    const app = ExpressAppFactory.create({
      healthController,
      webhookController,
      authController,
      authMiddleware,
    });

    httpServer = createServer(app);
    const ioServer = SocketServerFactory.create(httpServer);
    socketGateway = new SocketIoGateway(ioServer, strategy, eventBus);
    healthService.setSocketGateway(socketGateway);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        if (address && typeof address === "object") {
          port = address.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await socketGateway.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it("should reject connection when token is missing", async () => {
    const client = ClientSocket(`http://localhost:${port}`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: false,
    });

    const error = await new Promise<string>((resolve) => {
      client.on("connect_error", (err) => resolve(err.message));
    });

    client.disconnect();
    expect(error).toContain("Authentication failed");
  });

  it("should authenticate and receive whatsapp:message events", async () => {
    const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      auth: { token: masterKey },
      transports: ["websocket"],
      reconnection: false,
    });

    await new Promise<void>((resolve, reject) => {
      client.on("connect", () => resolve());
      client.on("connect_error", (err) => reject(err));
    });

    expect(client.connected).toBe(true);

    const messagePromise = new Promise<{ messageId: string; body: string }>((resolve) => {
      client.on("whatsapp:message", (data) => resolve(data));
    });

    eventBus.publish("webhook:message", {
      messageId: "wamid.test.123",
      from: "541130926776",
      timestamp: "1720000000",
      type: "text",
      body: "Hola desde Meta!",
      raw: {},
    });

    const received = await messagePromise;
    expect(received.messageId).toBe("wamid.test.123");
    expect(received.body).toBe("Hola desde Meta!");

    client.disconnect();
  });
});

