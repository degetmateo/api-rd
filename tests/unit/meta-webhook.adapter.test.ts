import { describe, it, expect } from "vitest";
import { MetaWebhookAdapter } from "../../src/infrastructure/adapters/meta-webhook.adapter.js";

describe("MetaWebhookAdapter", () => {
  const adapter = new MetaWebhookAdapter();

  it("should extract incoming text messages correctly", () => {
    const samplePayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [
                  {
                    from: "5491112345678",
                    id: "wamid.HBg12345",
                    timestamp: "1720000000",
                    type: "text",
                    text: { body: "Hola, tenés stock de cuadernos?" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const messages = adapter.extractMessages(samplePayload);
    expect(messages).toHaveLength(1);
    expect(messages[0].from).toBe("5491112345678");
    expect(messages[0].messageId).toBe("wamid.HBg12345");
    expect(messages[0].body).toBe("Hola, tenés stock de cuadernos?");
  });

  it("should extract message status updates correctly", () => {
    const samplePayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                statuses: [
                  {
                    id: "wamid.HBg12345",
                    status: "delivered" as const,
                    timestamp: "1720000050",
                    recipient_id: "5491112345678",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const statuses = adapter.extractStatuses(samplePayload);
    expect(statuses).toHaveLength(1);
    expect(statuses[0].messageId).toBe("wamid.HBg12345");
    expect(statuses[0].status).toBe("delivered");
    expect(statuses[0].recipientId).toBe("5491112345678");
  });

  it("should return empty arrays for empty payloads", () => {
    expect(adapter.extractMessages({})).toEqual([]);
    expect(adapter.extractStatuses({})).toEqual([]);
  });
});

