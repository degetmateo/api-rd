import crypto from "node:crypto";
import { ApiKeyEntity } from "../../domain/entities/api-key.entity.js";
import { IApiKeyRepository } from "../../domain/interfaces/api-key-repository.interface.js";
import { IAuthStrategy } from "../../domain/interfaces/auth-strategy.interface.js";

export class AuthService {
  private repository: IApiKeyRepository;
  private strategy: IAuthStrategy;

  constructor(repository: IApiKeyRepository, strategy: IAuthStrategy) {
    this.repository = repository;
    this.strategy = strategy;
  }

  public async validateToken(token: string): Promise<ApiKeyEntity | null> {
    return this.strategy.authenticate(token);
  }

  public async createApiKey(clientName: string): Promise<ApiKeyEntity> {
    const rawKey = `rd_${crypto.randomBytes(24).toString("hex")}`;
    const newEntity = new ApiKeyEntity({
      key: rawKey,
      clientName,
      active: true,
    });
    return this.repository.create(newEntity);
  }

  public async ensureDefaultClient(defaultKey: string, clientName: string): Promise<void> {
    const count = await this.repository.count();
    if (count === 0 && defaultKey) {
      await this.repository.create(
        new ApiKeyEntity({
          key: defaultKey,
          clientName,
          active: true,
        })
      );
      console.log(`[AuthService] Seeded default client credential for: ${clientName}`);
    }
  }
}

