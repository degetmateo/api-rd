export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

export interface IEventBus {
  publish<T>(event: string, data: T): void;
  subscribe<T>(event: string, handler: EventHandler<T>): void;
  unsubscribe<T>(event: string, handler: EventHandler<T>): void;
}

