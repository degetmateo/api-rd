import { describe, it, expect, vi } from "vitest";
import { WebhookService } from "../../src/application/services/webhook.service.js";
import { NodeEventBus } from "../../src/infrastructure/event-bus/node-event-bus.js";
import { MetaWebhookAdapter } from "../../src/infrastructure/adapters/meta-webhook.adapter.js";

describe("WebhookService", () => {
  const verifyToken = "my_secret_verify_token";
  const eventBus = new NodeEventBus();
  const adapter = new MetaWebhookAdapter();
  const service = new WebhookService(verifyToken, eventBus, adapter);

  it("should verify challenge when mode and token match", () => {
    const result = service.verifyChallenge({
      mode: "subscribe",
      token: "my_secret_verify_token",
      challenge: "1234567890",
    });

    expect(result).toBe("1234567890");
  });

  it("should fail verification when token does not match", () => {
    const result = service.verifyChallenge({
      mode: "subscribe",
      token: "wrong_token",
      challenge: "1234567890",
    });

    expect(result).toBeNull();
  });

  it("should fail verification when mode is not subscribe", () => {
    const result = service.verifyChallenge({
      mode: "other",
      token: "my_secret_verify_token",
      challenge: "1234567890",
    });

    expect(result).toBeNull();
  });

  it("should publish raw and parsed messages to event bus", () => {
    const publishSpy = vi.spyOn(eventBus, "publish");

    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "msg_1",
                    from: "123",
                    timestamp: "100",
                    type: "text",
                    text: { body: "Test" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const summary = service.processWebhook(payload);

    expect(summary.messagesCount).toBe(1);
    expect(publishSpy).toHaveBeenCalledWith("webhook:raw", payload);
    expect(publishSpy).toHaveBeenCalledWith(
      "webhook:message",
      expect.objectContaining({ messageId: "msg_1", body: "Test" })
    );
  });
});

