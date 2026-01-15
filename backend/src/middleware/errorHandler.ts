import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import logger from "../config/logger";

/**
 * Centralized error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default to 500 server error
  let statusCode = 500;
  let message = "Internal Server Error";
  let isOperational = false;

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === "ValidationError") {
    // Mongoose/Zod validation errors
    statusCode = 400;
    message = err.message;
    isOperational = true;
  } else if (err.name === "UnauthorizedError" || err.message.includes("jwt")) {
    statusCode = 401;
    message = "Authentication failed";
    isOperational = true;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    isOperational = true;
  } else {
    // Unknown error
    message = err.message || message;
  }

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.userId,
    });
  } else {
    logger.warn({
      message: err.message,
      url: req.url,
      method: req.method,
      statusCode,
    });
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: message,
    statusCode,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === "development" && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.url} not found`, 404);
  next(error);
};

/**
 * Async error wrapper - catches async errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
