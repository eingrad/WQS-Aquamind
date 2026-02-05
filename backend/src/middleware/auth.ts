import { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken } from "../utils/jwt";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        username?: string;
      };
    }
  }
}

/**
 * Authenticate middleware - Verify JWT token
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: "Authentication required",
        message: "No token provided",
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        error: "Authentication failed",
        message: error.message,
      });
    } else {
      res.status(401).json({
        error: "Authentication failed",
        message: "Invalid token",
      });
    }
  }
};

/**
 * Authorize middleware - Check user role
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "User not authenticated",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Access denied",
        message: `This action requires one of the following roles: ${allowedRoles.join(
          ", ",
        )}`,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - Sets user if token is valid, but doesn't require it
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Token invalid but not required, continue without user
    next();
  }
};
