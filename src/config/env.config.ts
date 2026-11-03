import "dotenv/config";

export class EnvConfig {
  public readonly port: number;
  public readonly nodeEnv: string;
  public readonly mongoUri: string;
  public readonly webhookVerifyToken: string;
  public readonly serverApiKey: string;
  public readonly metaToken?: string;

  constructor() {
    this.port = parseInt(process.env.PORT || "3000", 10);
    this.nodeEnv = process.env.NODE_ENV || "development";
    this.mongoUri = process.env.MONGODB_URI || "";
    this.webhookVerifyToken = process.env.WEBHOOK_VERIFY_TOKEN || "libreria_rd_webhook_verify_token";
    this.serverApiKey = process.env.SERVER_API_KEY || "libreriard-secret-key-2026";
    this.metaToken = process.env.META_TOKEN;
  }

  public isProduction(): boolean {
    return this.nodeEnv === "production";
  }
}

export const envConfig = new EnvConfig();

