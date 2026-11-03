import express, { Express } from "express";
import cors from "cors";
import { ApiRouter, ApiRouterDependencies } from "./routes/api.router.js";
import { ErrorMiddleware } from "./middlewares/error.middleware.js";

export class ExpressAppFactory {
  public static create(dependencies: ApiRouterDependencies): Express {
    const app = express();

    app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
      })
    );

    app.use(express.json({ limit: "5mb" }));
    app.use(express.urlencoded({ extended: true }));

    // Mount API Routes
    app.use(ApiRouter.create(dependencies));

    // Error handling middleware (Pipes and Filters POSAD)
    app.use(ErrorMiddleware.handle);

    return app;
  }
}

