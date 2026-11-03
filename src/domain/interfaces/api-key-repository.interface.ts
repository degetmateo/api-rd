import { ApiKeyEntity } from "../entities/api-key.entity.js";

export interface IApiKeyRepository {
  findByKey(key: string): Promise<ApiKeyEntity | null>;
  create(apiKey: ApiKeyEntity): Promise<ApiKeyEntity>;
  updateLastUsed(id: string): Promise<void>;
  count(): Promise<number>;
}

