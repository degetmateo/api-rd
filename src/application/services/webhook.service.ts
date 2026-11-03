import { IEventBus } from "../../domain/interfaces/event-bus.interface.js";
import { MetaWebhookAdapter, MetaWebhookPayload } from "../../infrastructure/adapters/meta-webhook.adapter.js";

export interface VerifyWebhookParams {
  mode?: string;
  token?: string;
  challenge?: string;
}

export class WebhookService {
  private verifyToken: string;
  private eventBus: IEventBus;
  private adapter: MetaWebhookAdapter;

  constructor(verifyToken: string, eventBus: IEventBus, adapter: MetaWebhookAdapter) {
    this.verifyToken = verifyToken;
    this.eventBus = eventBus;
    this.adapter = adapter;
  }

  public verifyChallenge(params: VerifyWebhookParams): string | null {
    const { mode, token, challenge } = params;
    if (mode === "subscribe" && token === this.verifyToken && challenge) {
      return challenge;
    }
    return null;
  }

  public processWebhook(payload: MetaWebhookPayload): { messagesCount: number; statusesCount: number } {
    this.eventBus.publish("webhook:raw", payload);

    const messages = this.adapter.extractMessages(payload);
    for (const msg of messages) {
      this.eventBus.publish("webhook:message", msg);
    }

    const statuses = this.adapter.extractStatuses(payload);
    for (const status of statuses) {
      this.eventBus.publish("webhook:status", status);
    }

    return {
      messagesCount: messages.length,
      statusesCount: statuses.length,
    };
  }
}

