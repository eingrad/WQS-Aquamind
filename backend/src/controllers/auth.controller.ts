import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { verifyRefreshToken } from "../utils/jwt";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../utils/validation";
import { z } from "zod";

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const result = await authService.register(validatedData);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const result = await authService.login(validatedData);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = refreshSchema.parse(req.body);

    // Verify refresh token
    const decoded = verifyRefreshToken(validatedData.refreshToken);

    // Generate new tokens (pass jti + exp for revocation and rotation)
    const result = await authService.refresh(
      decoded.userId,
      decoded.email,
      decoded.role,
      decoded.jti,
      decoded.exp
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
};

/**
 * Logout user — revokes the refresh token server-side
 * POST /api/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = logoutSchema.parse(req.body);

    // Decode the refresh token to extract jti and expiry
    const decoded = verifyRefreshToken(validatedData.refreshToken);

    if (decoded.jti) {
      // Calculate expiry date from the token's exp claim
      const expiresAt = decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback: 7 days

      // Revoke the refresh token
      await authService.revokeRefreshToken(
        decoded.jti,
        decoded.userId,
        expiresAt
      );
    }

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    // Even if token verification fails, treat logout as successful
    // (the token may already be expired/invalid)
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    // Get user profile
    const profile = await authService.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
};
