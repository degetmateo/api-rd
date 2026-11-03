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

describe("Webhook Endpoints", () => {
  const db = DatabaseConnection.getInstance();
  const healthService = new HealthService(db, undefined, "test");
  const healthController = new HealthController(healthService);

  const eventBus = new NodeEventBus();
  const adapter = new MetaWebhookAdapter();
  const verifyToken = "expected_meta_token";
  const webhookService = new WebhookService(verifyToken, eventBus, adapter);
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

  describe("GET /webhook", () => {
    it("should respond with challenge when parameters are valid", async () => {
      const res = await request(app)
        .get("/webhook")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "expected_meta_token",
          "hub.challenge": "challenge_string_123",
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe("challenge_string_123");
    });

    it("should respond with 403 when verify_token is invalid", async () => {
      const res = await request(app)
        .get("/webhook")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "bad_token",
          "hub.challenge": "challenge_string_123",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /webhook", () => {
    it("should accept valid Meta WhatsApp payload and return 200", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  messages: [
                    {
                      from: "541130926776",
                      id: "wamid.123",
                      timestamp: "1720000000",
                      type: "text",
                      text: { body: "Hola!" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await request(app).post("/webhook").send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.processed.messagesCount).toBe(1);
    });
  });
});

