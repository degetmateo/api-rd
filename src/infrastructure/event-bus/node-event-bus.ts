import { EventEmitter } from "node:events";
import { EventHandler, IEventBus } from "../../domain/interfaces/event-bus.interface.js";

export class NodeEventBus implements IEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  public publish<T>(event: string, data: T): void {
    this.emitter.emit(event, data);
  }

  public subscribe<T>(event: string, handler: EventHandler<T>): void {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
  }

  public unsubscribe<T>(event: string, handler: EventHandler<T>): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
  }
}

