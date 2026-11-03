import { Request, Response } from "express";
import { WebhookService } from "../../application/services/webhook.service.js";

export class WebhookController {
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  public verify = (req: Request, res: Response): void => {
    const mode = req.query["hub.mode"] as string | undefined;
    const token = req.query["hub.verify_token"] as string | undefined;
    const challenge = req.query["hub.challenge"] as string | undefined;

    const verifiedChallenge = this.webhookService.verifyChallenge({ mode, token, challenge });

    if (verifiedChallenge) {
      res.status(200).send(verifiedChallenge);
      return;
    }

    res.status(403).send("Verification failed");
  };

  public handlePayload = (req: Request, res: Response): void => {
    try {
      const summary = this.webhookService.processWebhook(req.body);
      res.status(200).json({ success: true, processed: summary });
    } catch (error) {
      console.error("[WebhookController] Error processing payload:", error);
      res.status(500).json({ success: false, error: "Failed to process webhook" });
    }
  };
}

