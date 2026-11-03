import { describe, it, expect, vi } from "vitest";
import { HealthService } from "../../src/application/services/health.service.js";
import { DatabaseConnection } from "../../src/infrastructure/database/database.connection.js";
import { ISocketGateway } from "../../domain/interfaces/socket-gateway.interface.js";

describe("HealthService", () => {
  it("should return healthy status when database is connected", () => {
    const db = DatabaseConnection.getInstance();
    vi.spyOn(db, "getHealth").mockReturnValue({
      connected: true,
      state: "connected",
    });

    const mockSocketGateway: ISocketGateway = {
      broadcast: vi.fn(),
      getConnectedClientsCount: () => 3,
      close: async () => {},
    };

    const service = new HealthService(db, mockSocketGateway, "test");
    const health = service.getHealth();

    expect(health.status).toBe("ok");
    expect(health.environment).toBe("test");
    expect(health.services.database.connected).toBe(true);
    expect(health.services.socket.connectedClients).toBe(3);
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("should return degraded status when database is disconnected", () => {
    const db = DatabaseConnection.getInstance();
    vi.spyOn(db, "getHealth").mockReturnValue({
      connected: false,
      state: "disconnected",
    });

    const service = new HealthService(db, undefined, "test");
    const health = service.getHealth();

    expect(health.status).toBe("degraded");
    expect(health.services.database.connected).toBe(false);
  });
});

