import { Request, Response } from "express";
import { HealthService } from "../../application/services/health.service.js";

export class HealthController {
  private healthService: HealthService;

  constructor(healthService: HealthService) {
    this.healthService = healthService;
  }

  public getHealth = (_req: Request, res: Response): void => {
    const health = this.healthService.getHealth();
    const statusCode = health.status === "down" ? 503 : 200;
    res.status(statusCode).json(health);
  };
}

