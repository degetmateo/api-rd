import { describe, it, expect } from "vitest";
import request from "supertest";
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

describe("GET /health Endpoint", () => {
  const db = DatabaseConnection.getInstance();
  const healthService = new HealthService(db, undefined, "test");
  const healthController = new HealthController(healthService);

  const eventBus = new NodeEventBus();
  const adapter = new MetaWebhookAdapter();
  const webhookService = new WebhookService("test_token", eventBus, adapter);
  const webhookController = new WebhookController(webhookService);

  const repo = new InMemoryApiKeyRepository();
  const strategy = new ApiKeyStrategy(repo, "master-test-key");
  const authService = new AuthService(repo, strategy);
  const authController = new AuthController(authService);
  const authMiddleware = new AuthMiddleware(authService);

  const app = ExpressAppFactory.create({
    healthController,
    webhookController,
    authController,
    authMiddleware,
  });

  it("should return 200/503 and valid health payload JSON", async () => {
    const res = await request(app).get("/health");

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptimeSeconds");
    expect(res.body).toHaveProperty("services");
    expect(res.body.services).toHaveProperty("database");
    expect(res.body.services).toHaveProperty("socket");
  });
});

