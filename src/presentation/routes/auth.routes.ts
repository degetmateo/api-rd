import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";

export class AuthRoutes {
  public static create(controller: AuthController, authMiddleware: AuthMiddleware): Router {
    const router = Router();
    router.post("/auth/client-key", authMiddleware.handle, controller.createClientKey);
    router.get("/auth/validate", authMiddleware.handle, controller.validate);
    return router;
  }
}

