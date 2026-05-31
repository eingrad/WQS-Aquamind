import jwt from "jsonwebtoken";
import crypto from "crypto";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET is not set in environment variables. Server cannot start without a secure secret.",
  );
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error(
    "FATAL: JWT_REFRESH_SECRET is not set in environment variables. Server cannot start without a secure secret.",
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  jti?: string;
}

/**
 * Generate JWT access token (short-lived)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "aquamind-api",
    audience: "aquamind-client",
  } as jwt.SignOptions);
};

/**
 * Generate JWT refresh token (long-lived)
 * Includes a unique jti (JWT ID) for revocation support.
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: "aquamind-api",
    audience: "aquamind-client",
  } as jwt.SignOptions);
};

/**
 * Verify JWT access token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "aquamind-api",
      audience: "aquamind-client",
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      }
    }
    throw new Error("Token verification failed");
  }
};

/**
 * Verify JWT refresh token
 * Returns the decoded payload including jti for revocation checks.
 */
export const verifyRefreshToken = (token: string): TokenPayload & { exp?: number } => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "aquamind-api",
      audience: "aquamind-client",
    }) as TokenPayload & { exp?: number };
    return decoded;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid refresh token");
      }
    }
    throw new Error("Refresh token verification failed");
  }
};

/**
 * Extract token from Authorization header
 */
export const extractToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};
