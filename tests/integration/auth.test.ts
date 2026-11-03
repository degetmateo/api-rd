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

describe("Auth Endpoints", () => {
  const masterKey = "admin_master_key_123";
  const repo = new InMemoryApiKeyRepository();
  const strategy = new ApiKeyStrategy(repo, masterKey);
  const authService = new AuthService(repo, strategy);
  const authController = new AuthController(authService);
  const authMiddleware = new AuthMiddleware(authService);

  const db = DatabaseConnection.getInstance();
  const healthService = new HealthService(db, undefined, "test");
  const healthController = new HealthController(healthService);

  const eventBus = new NodeEventBus();
  const adapter = new MetaWebhookAdapter();
  const webhookService = new WebhookService("test_token", eventBus, adapter);
  const webhookController = new WebhookController(webhookService);

  const app = ExpressAppFactory.create({
    healthController,
    webhookController,
    authController,
    authMiddleware,
  });

  it("should reject requests without auth headers", async () => {
    const res = await request(app).get("/api/auth/validate");
    expect(res.status).toBe(401);
  });

  it("should reject requests with invalid api key", async () => {
    const res = await request(app)
      .get("/api/auth/validate")
      .set("x-api-key", "invalid-key");
    expect(res.status).toBe(403);
  });

  it("should authenticate with master key", async () => {
    const res = await request(app)
      .get("/api/auth/validate")
      .set("x-api-key", masterKey);
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
  });

  it("should create new client key with master key and authenticate with it", async () => {
    const createRes = await request(app)
      .post("/api/auth/client-key")
      .set("Authorization", `Bearer ${masterKey}`)
      .send({ clientName: "Electron Client 1" });

    expect(createRes.status).toBe(201);
    const newKey = createRes.body.data.key;
    expect(newKey).toBeDefined();

    const validateRes = await request(app)
      .get("/api/auth/validate")
      .set("x-api-key", newKey);

    expect(validateRes.status).toBe(200);
    expect(validateRes.body.client.clientName).toBe("Electron Client 1");
  });
});

