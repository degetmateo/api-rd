import { describe, it, expect } from "vitest";
import { AuthService } from "../../src/application/services/auth.service.js";
import { InMemoryApiKeyRepository } from "../../src/infrastructure/repositories/in-memory-api-key.repository.js";
import { ApiKeyStrategy } from "../../src/application/strategies/api-key.strategy.js";

describe("AuthService", () => {
  it("should create and authenticate an API key", async () => {
    const repository = new InMemoryApiKeyRepository();
    const strategy = new ApiKeyStrategy(repository, "master-secret");
    const service = new AuthService(repository, strategy);

    const created = await service.createApiKey("Electron Desktop App");
    expect(created.key).toMatch(/^rd_/);
    expect(created.clientName).toBe("Electron Desktop App");

    const validated = await service.validateToken(created.key);
    expect(validated).not.toBeNull();
    expect(validated?.clientName).toBe("Electron Desktop App");
  });

  it("should authenticate using the master key", async () => {
    const repository = new InMemoryApiKeyRepository();
    const strategy = new ApiKeyStrategy(repository, "master-secret");
    const service = new AuthService(repository, strategy);

    const validated = await service.validateToken("master-secret");
    expect(validated).not.toBeNull();
    expect(validated?.clientName).toBe("Master Admin Key");
  });

  it("should reject invalid keys", async () => {
    const repository = new InMemoryApiKeyRepository();
    const strategy = new ApiKeyStrategy(repository, "master-secret");
    const service = new AuthService(repository, strategy);

    const validated = await service.validateToken("invalid-key-xyz");
    expect(validated).toBeNull();
  });
});

