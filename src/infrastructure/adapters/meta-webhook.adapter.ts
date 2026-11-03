import {
  IncomingMessageEvent,
  MessageStatusEvent,
} from "../../domain/events/webhook-payload.event.js";

export interface MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          [key: string]: unknown;
        }>;
        statuses?: Array<{
          id: string;
          status: "sent" | "delivered" | "read" | "failed";
          timestamp: string;
          recipient_id: string;
          [key: string]: unknown;
        }>;
      };
      field?: string;
    }>;
  }>;
}

export class MetaWebhookAdapter {
  public extractMessages(payload: MetaWebhookPayload): IncomingMessageEvent[] {
    const results: IncomingMessageEvent[] = [];
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        for (const msg of change.value?.messages || []) {
          results.push({
            messageId: msg.id,
            from: msg.from,
            timestamp: msg.timestamp,
            type: msg.type,
            body: msg.text?.body,
            raw: msg,
          });
        }
      }
    }
    return results;
  }

  public extractStatuses(payload: MetaWebhookPayload): MessageStatusEvent[] {
    const results: MessageStatusEvent[] = [];
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        for (const status of change.value?.statuses || []) {
          results.push({
            messageId: status.id,
            recipientId: status.recipient_id,
            status: status.status,
            timestamp: status.timestamp,
            raw: status,
          });
        }
      }
    }
    return results;
  }
}

