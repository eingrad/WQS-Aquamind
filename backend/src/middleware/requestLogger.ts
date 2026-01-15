import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Log request
  logger.http({
    message: `${req.method} ${req.url}`,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: (req as any).user?.userId,
  });

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "http";

    logger.log(logLevel, {
      message: `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.userId,
    });
  });

  next();
};
