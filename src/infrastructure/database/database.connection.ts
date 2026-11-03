import mongoose from "mongoose";
import { DatabaseHealth } from "../../domain/types/health.types.js";

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(uri: string): Promise<void> {
    if (this.isConnected || !uri) return;

    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      console.log("[Database] Connected successfully to MongoDB");
    } catch (error) {
      this.isConnected = false;
      console.error("[Database] Connection failed:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    await mongoose.disconnect();
    this.isConnected = false;
    console.log("[Database] Disconnected from MongoDB");
  }

  public getHealth(): DatabaseHealth {
    const stateMap: Record<number, DatabaseHealth["state"]> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const readyState = mongoose.connection.readyState;
    return {
      connected: readyState === 1,
      state: stateMap[readyState] || "unknown",
    };
  }
}

