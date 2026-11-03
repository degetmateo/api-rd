import { ApiKeyEntity } from "../../domain/entities/api-key.entity.js";
import { IApiKeyRepository } from "../../domain/interfaces/api-key-repository.interface.js";
import { ApiKeyModel, IApiKeyDoc } from "../database/models/api-key.model.js";

export class MongoApiKeyRepository implements IApiKeyRepository {
  public async findByKey(key: string): Promise<ApiKeyEntity | null> {
    const doc = await ApiKeyModel.findOne({ key, active: true }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  public async create(apiKey: ApiKeyEntity): Promise<ApiKeyEntity> {
    const doc = await ApiKeyModel.create({
      key: apiKey.key,
      clientName: apiKey.clientName,
      active: apiKey.active,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
    });
    return this.toEntity(doc);
  }

  public async updateLastUsed(id: string): Promise<void> {
    await ApiKeyModel.findByIdAndUpdate(id, { lastUsedAt: new Date() }).exec();
  }

  public async count(): Promise<number> {
    return ApiKeyModel.countDocuments().exec();
  }

  private toEntity(doc: IApiKeyDoc): ApiKeyEntity {
    return new ApiKeyEntity({
      id: doc._id.toString(),
      key: doc.key,
      clientName: doc.clientName,
      active: doc.active,
      createdAt: doc.createdAt,
      lastUsedAt: doc.lastUsedAt,
    });
  }
}

