import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import {
  updateUserSchema,
  changePasswordSchema,
  getUsersQuerySchema,
} from "../utils/validation";
import { z } from "zod";

/**
 * Get all users (paginated)
 * GET /api/users
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = getUsersQuerySchema.parse(req.query);
    const result = await userService.getAllUsers(query);

    res.status(200).json({
      success: true,
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

    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
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

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    const user = await userService.updateUser(
      id,
      validatedData,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
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
 * Delete user (soft delete)
 * DELETE /api/users/:id
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser(id, req.user!.userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
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
 * Hard delete user (permanent)
 * DELETE /api/users/:id/hard
 */
export const hardDeleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await userService.hardDeleteUser(id, req.user!.userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
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
 * Change user password
 * PUT /api/users/:id/password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = changePasswordSchema.parse(req.body);

    // Users can only change their own password unless admin
    if (req.user?.userId !== id && req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "You can only change your own password",
      });
      return;
    }

    const result = await userService.changePassword(
      id,
      validatedData.currentPassword,
      validatedData.newPassword,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      ...result,
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
