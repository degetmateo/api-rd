import { ApiKeyEntity } from "../entities/api-key.entity.js";

export interface IAuthStrategy {
  authenticate(tokenOrKey: string): Promise<ApiKeyEntity | null>;
}

