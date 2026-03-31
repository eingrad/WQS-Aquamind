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
        message: "You do not have permission to perform this action",
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

/**
 * Internal secret middleware - for machine-to-machine calls (e.g. MQTT generator scripts)
 * These callers have no user session, so JWT is not applicable.
 *
 * The caller must send the header:
 *   X-Internal-Secret: <value of INTERNAL_API_SECRET in .env>
 *
 * Fails safe: if INTERNAL_API_SECRET is not configured, all requests are denied (503).
 */
export const requireInternalSecret = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const expected = process.env.INTERNAL_API_SECRET;

  if (!expected) {
    res.status(503).json({
      error: "Service unavailable",
      message: "INTERNAL_API_SECRET is not configured on the server",
    });
    return;
  }

  const provided = req.headers["x-internal-secret"];

  if (!provided || provided !== expected) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing X-Internal-Secret header",
    });
    return;
  }

  next();
};
