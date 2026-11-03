import { envConfig } from "./config/env.config.js";
import { ApplicationServer } from "./server.js";

const server = new ApplicationServer(envConfig);

async function bootstrap() {
  try {
    await server.start();
  } catch (error) {
    console.error("[Bootstrap] Fatal error during startup:", error);
    process.exit(1);
  }
}

const handleShutdown = async (signal: string) => {
  console.log(`[Server] Received ${signal}, shutting down gracefully...`);
  try {
    await server.stop();
    console.log("[Server] Successfully shut down");
    process.exit(0);
  } catch (error) {
    console.error("[Server] Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

bootstrap();

