import { Request, Response } from "express";
import { AuthService } from "../../application/services/auth.service.js";

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public createClientKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientName } = req.body;
      if (!clientName || typeof clientName !== "string") {
        res.status(400).json({ success: false, error: "clientName is required" });
        return;
      }

      const entity = await this.authService.createApiKey(clientName);
      res.status(201).json({
        success: true,
        data: {
          key: entity.key,
          clientName: entity.clientName,
          createdAt: entity.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create API key" });
    }
  };

  public validate = async (req: Request, res: Response): Promise<void> => {
    const client = (req as Request & { client?: unknown }).client;
    res.status(200).json({ success: true, authenticated: true, client });
  };
}

