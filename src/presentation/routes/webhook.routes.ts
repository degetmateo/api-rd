import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller.js";

export class WebhookRoutes {
  public static create(controller: WebhookController): Router {
    const router = Router();
    router.get("/webhook", controller.verify);
    router.post("/webhook", controller.handlePayload);
    return router;
  }
}

