import prisma from "../config/database";
import { hashPassword, validatePasswordStrength } from "../utils/password";
import * as auditService from "./audit.service";

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (options: {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
}) => {
  const { page = 1, limit = 10, role, isActive } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (role) {
    where.userRole = { roleId: role };
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        userRole: {
          select: {
            roleId: true,
            role: {
              select: {
                roleName: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      lastLogin: true,
      loginAttempts: true,
      lockUntil: true,
      createdAt: true,
      updatedAt: true,
      userRole: {
        select: {
          roleId: true,
          role: {
            select: {
              roleName: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Update user
 */
export const updateUser = async (
  userId: string,
  data: {
    fullName?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  },
  performedBy: string // Add who made the change
) => {
  const { fullName, email, role, isActive } = data;

  // Get old user data for audit
  const oldUser = await getUserById(userId);
  const oldRole = oldUser.userRole?.roleId;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new Error("Email already taken by another user");
    }
  }

  // Check if role exists
  if (role) {
    const roleExists = await prisma.role.findUnique({
      where: { roleId: role },
    });

    if (!roleExists) {
      throw new Error(`Invalid role: ${role}`);
    }
  }

  // Update user in a transaction
  const updatedUser = await prisma.$transaction(async (tx) => {
    // Update user details
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        fullName,
        email,
        isActive,
      },
    });

    // Update role if provided
    if (role) {
      await tx.userRole.upsert({
        where: { userId },
        update: { roleId: role },
        create: { userId, roleId: role },
      });
    }

    return user;
  });

  // Audit logging
  await auditService.logUserUpdated(performedBy, userId, oldUser, updatedUser);

  // Log role change separately if role was changed
  if (role && oldRole && role !== oldRole) {
    await auditService.logRoleChanged(performedBy, userId, oldRole, role);
  }

  return getUserById(userId);
};

/**
 * Delete user (soft delete by deactivating)
 */
export const deleteUser = async (userId: string, performedBy: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
    },
  });

  // Audit logging
  await auditService.logUserDeleted(performedBy, userId, false);

  return { message: "User deactivated successfully", userId: user.id };
};

/**
 * Hard delete user (permanent, for admin only)
 */
export const hardDeleteUser = async (userId: string, performedBy: string) => {
  await prisma.$transaction(async (tx) => {
    // 1. Set optional foreign keys to null to preserve system history
    await tx.auditLog.updateMany({
      where: { userId },
      data: { userId: null },
    });

    await tx.validationStatus.updateMany({
      where: { validatedBy: userId },
      data: { validatedBy: null },
    });

    await tx.approvalRequest.updateMany({
      where: { adminId: userId },
      data: { adminId: null },
    });

    await tx.alertHistory.updateMany({
      where: { acknowledgedBy: userId },
      data: { acknowledgedBy: null },
    });

    await tx.alertThreshold.updateMany({
      where: { createdBy: userId },
      data: { createdBy: null },
    });

    await tx.approvalRequest.updateMany({
      where: { qcReviewerId: userId },
      data: { qcReviewerId: null },
    });

    // 2. Delete data that belongs exclusively to the user
    await tx.report.deleteMany({ where: { createdBy: userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.userNotificationPreference.deleteMany({ where: { userId } });
    
    // Check if revokedToken exists on tx (since we recently added it)
    if ((tx as any).revokedToken) {
      await (tx as any).revokedToken.deleteMany({ where: { userId } });
    }

    // Delete user role first (foreign key)
    await tx.userRole.deleteMany({
      where: { userId },
    });

    // Delete user
    await tx.user.delete({
      where: { id: userId },
    });
  });

  // Audit logging
  await auditService.logUserDeleted(performedBy, userId, true);

  return { message: "User permanently deleted", userId };
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  performedBy: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify current password
  const bcrypt = await import("bcryptjs");
  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  // Validate new password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  // Hash and update password
  const newPasswordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
    },
  });

  // Audit logging
  await auditService.logPasswordChanged(performedBy, userId);

  return { message: "Password changed successfully" };
};
