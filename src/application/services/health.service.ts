import { HealthStatusResponse, HealthState } from "../../domain/types/health.types.js";
import { DatabaseConnection } from "../../infrastructure/database/database.connection.js";
import { ISocketGateway } from "../../domain/interfaces/socket-gateway.interface.js";

export class HealthService {
  private dbConnection: DatabaseConnection;
  private socketGateway?: ISocketGateway;
  private environment: string;

  constructor(
    dbConnection: DatabaseConnection,
    socketGateway?: ISocketGateway,
    environment = "development"
  ) {
    this.dbConnection = dbConnection;
    this.socketGateway = socketGateway;
    this.environment = environment;
  }

  public setSocketGateway(socketGateway: ISocketGateway): void {
    this.socketGateway = socketGateway;
  }

  public getHealth(): HealthStatusResponse {
    const dbHealth = this.dbConnection.getHealth();
    const socketClients = this.socketGateway?.getConnectedClientsCount() ?? 0;

    let status: HealthState = "ok";
    if (!dbHealth.connected) {
      status = "degraded";
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: this.environment,
      services: {
        database: dbHealth,
        socket: {
          connectedClients: socketClients,
        },
      },
    };
  }
}

