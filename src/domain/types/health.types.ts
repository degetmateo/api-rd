export type HealthState = "ok" | "degraded" | "down";

export interface DatabaseHealth {
  connected: boolean;
  state: "connected" | "connecting" | "disconnecting" | "disconnected" | "unknown";
}

export interface SocketHealth {
  connectedClients: number;
}

export interface HealthStatusResponse {
  status: HealthState;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: DatabaseHealth;
    socket: SocketHealth;
  };
}

