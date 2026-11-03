import { ApiKeyEntity } from "../../domain/entities/api-key.entity.js";
import { IApiKeyRepository } from "../../domain/interfaces/api-key-repository.interface.js";
import { IAuthStrategy } from "../../domain/interfaces/auth-strategy.interface.js";

export class ApiKeyStrategy implements IAuthStrategy {
  private repository: IApiKeyRepository;
  private masterKey?: string;

  constructor(repository: IApiKeyRepository, masterKey?: string) {
    this.repository = repository;
    this.masterKey = masterKey;
  }

  public async authenticate(tokenOrKey: string): Promise<ApiKeyEntity | null> {
    if (!tokenOrKey) return null;

    if (this.masterKey && tokenOrKey === this.masterKey) {
      return new ApiKeyEntity({
        key: this.masterKey,
        clientName: "Master Admin Key",
        active: true,
      });
    }

    const keyEntity = await this.repository.findByKey(tokenOrKey);
    if (!keyEntity || !keyEntity.isValid()) {
      return null;
    }

    if (keyEntity.id) {
      await this.repository.updateLastUsed(keyEntity.id);
    }

    return keyEntity;
  }
}

