export interface IncomingMessageEvent {
  messageId: string;
  from: string;
  timestamp: string;
  type: string;
  body?: string;
  raw: unknown;
}

export interface MessageStatusEvent {
  messageId: string;
  recipientId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  raw: unknown;
}

export interface WebhookDomainEvents {
  "webhook:raw": unknown;
  "webhook:message": IncomingMessageEvent;
  "webhook:status": MessageStatusEvent;
}

