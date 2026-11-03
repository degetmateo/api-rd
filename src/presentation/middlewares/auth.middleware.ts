import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../application/services/auth.service.js";

export class AuthMiddleware {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const headerToken = req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
    const apiKey = (req.headers["x-api-key"] as string) || headerToken;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: "Unauthorized: Missing API key or Bearer token in headers",
      });
      return;
    }

    const client = await this.authService.validateToken(apiKey);
    if (!client) {
      res.status(403).json({
        success: false,
        error: "Forbidden: Invalid or inactive API key",
      });
      return;
    }

    (req as Request & { client?: unknown }).client = client;
    next();
  };
}

