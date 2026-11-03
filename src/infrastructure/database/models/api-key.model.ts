import mongoose, { Schema, Document } from "mongoose";

export interface IApiKeyDoc extends Document {
  key: string;
  clientName: string;
  active: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

const ApiKeySchema = new Schema<IApiKeyDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    clientName: { type: String, required: true },
    active: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ApiKeyModel = mongoose.model<IApiKeyDoc>("ApiKey", ApiKeySchema);

