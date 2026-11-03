import { Request, Response, NextFunction } from "express";

export class ErrorMiddleware {
  public static handle(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error("[ServerError]", err.stack || err.message);

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
}

