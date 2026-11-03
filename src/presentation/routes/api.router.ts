import { Router } from "express";
import { HealthRoutes } from "./health.routes.js";
import { WebhookRoutes } from "./webhook.routes.js";
import { AuthRoutes } from "./auth.routes.js";
import { HealthController } from "../controllers/health.controller.js";
import { WebhookController } from "../controllers/webhook.controller.js";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";

export interface ApiRouterDependencies {
  healthController: HealthController;
  webhookController: WebhookController;
  authController: AuthController;
  authMiddleware: AuthMiddleware;
}

export class ApiRouter {
  public static create(deps: ApiRouterDependencies): Router {
    const router = Router();

    router.use(HealthRoutes.create(deps.healthController));
    router.use(WebhookRoutes.create(deps.webhookController));
    router.use("/api", AuthRoutes.create(deps.authController, deps.authMiddleware));

    return router;
  }
}

