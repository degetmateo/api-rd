import { ApiKeyEntity } from "../../domain/entities/api-key.entity.js";
import { IApiKeyRepository } from "../../domain/interfaces/api-key-repository.interface.js";

export class InMemoryApiKeyRepository implements IApiKeyRepository {
  private keys: Map<string, ApiKeyEntity> = new Map();

  public async findByKey(key: string): Promise<ApiKeyEntity | null> {
    const item = this.keys.get(key);
    return item && item.active ? item : null;
  }

  public async create(apiKey: ApiKeyEntity): Promise<ApiKeyEntity> {
    this.keys.set(apiKey.key, apiKey);
    return apiKey;
  }

  public async updateLastUsed(id: string): Promise<void> {
    for (const [key, entity] of this.keys.entries()) {
      if (entity.id === id || entity.key === id) {
        this.keys.set(
          key,
          new ApiKeyEntity({
            id: entity.id,
            key: entity.key,
            clientName: entity.clientName,
            active: entity.active,
            createdAt: entity.createdAt,
            lastUsedAt: new Date(),
          })
        );
        break;
      }
    }
  }

  public async count(): Promise<number> {
    return this.keys.size;
  }
}

