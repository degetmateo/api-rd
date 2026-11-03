import { createServer, Server as HttpServer } from "node:http";
import { Express } from "express";
import { EnvConfig } from "./config/env.config.js";
import { DatabaseConnection } from "./infrastructure/database/database.connection.js";
import { MongoApiKeyRepository } from "./infrastructure/repositories/mongo-api-key.repository.js";
import { ApiKeyStrategy } from "./application/strategies/api-key.strategy.js";
import { AuthService } from "./application/services/auth.service.js";
import { NodeEventBus } from "./infrastructure/event-bus/node-event-bus.js";
import { MetaWebhookAdapter } from "./infrastructure/adapters/meta-webhook.adapter.js";
import { WebhookService } from "./application/services/webhook.service.js";
import { HealthService } from "./application/services/health.service.js";
import { AuthMiddleware } from "./presentation/middlewares/auth.middleware.js";
import { HealthController } from "./presentation/controllers/health.controller.js";
import { WebhookController } from "./presentation/controllers/webhook.controller.js";
import { AuthController } from "./presentation/controllers/auth.controller.js";
import { ExpressAppFactory } from "./presentation/express-app.factory.js";
import { SocketServerFactory } from "./infrastructure/socket/socket-server.factory.js";
import { SocketIoGateway } from "./infrastructure/socket/socket-io.gateway.js";

export class ApplicationServer {
  private config: EnvConfig;
  private httpServer?: HttpServer;
  private socketGateway?: SocketIoGateway;
  private db: DatabaseConnection;

  constructor(config: EnvConfig) {
    this.config = config;
    this.db = DatabaseConnection.getInstance();
  }

  public async start(): Promise<HttpServer> {
    if (this.config.mongoUri) {
      await this.db.connect(this.config.mongoUri);
    }

    const repository = new MongoApiKeyRepository();
    const authStrategy = new ApiKeyStrategy(repository, this.config.serverApiKey);
    const authService = new AuthService(repository, authStrategy);
    const eventBus = new NodeEventBus();
    const webhookAdapter = new MetaWebhookAdapter();
    const webhookService = new WebhookService(this.config.webhookVerifyToken, eventBus, webhookAdapter);
    const healthService = new HealthService(this.db, undefined, this.config.nodeEnv);

    if (this.config.mongoUri) {
      await authService.ensureDefaultClient(this.config.serverApiKey, "Electron Client - Libreria RD");
    }

    const authMiddleware = new AuthMiddleware(authService);
    const healthController = new HealthController(healthService);
    const webhookController = new WebhookController(webhookService);
    const authController = new AuthController(authService);

    const app: Express = ExpressAppFactory.create({
      healthController,
      webhookController,
      authController,
      authMiddleware,
    });

    this.httpServer = createServer(app);
    const socketServer = SocketServerFactory.create(this.httpServer);
    this.socketGateway = new SocketIoGateway(socketServer, authStrategy, eventBus);
    healthService.setSocketGateway(this.socketGateway);

    return new Promise((resolve) => {
      this.httpServer?.listen(this.config.port, () => {
        console.log(`[Server] Running on port ${this.config.port} (${this.config.nodeEnv})`);
        resolve(this.httpServer!);
      });
    });
  }

  public async stop(): Promise<void> {
    if (this.socketGateway) await this.socketGateway.close();
    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.close((err) => (err ? reject(err) : resolve()));
      });
    }
    await this.db.disconnect();
  }
}
