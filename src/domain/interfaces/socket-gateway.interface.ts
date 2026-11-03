export interface ISocketGateway {
  broadcast<T>(event: string, payload: T): void;
  getConnectedClientsCount(): number;
  close(): Promise<void>;
}

