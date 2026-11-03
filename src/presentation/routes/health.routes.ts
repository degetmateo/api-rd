import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";

export class HealthRoutes {
  public static create(controller: HealthController): Router {
    const router = Router();
    router.get("/health", controller.getHealth);
    return router;
  }
}

