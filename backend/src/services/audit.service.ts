import prisma from "../config/database";

export enum AuditAction {
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  USER_DEACTIVATED = "USER_DEACTIVATED",
  USER_ACTIVATED = "USER_ACTIVATED",
}

interface AuditLogData {
  action: AuditAction;
  performedBy: string; // User ID who performed the action
  targetUserId: string; // User ID affected by the action
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: AuditLogData) => {
  const { action, performedBy, targetUserId, changes, metadata } = data;

  // Get performer details
  const performer = await prisma.user.findUnique({
    where: { id: performedBy },
    select: {
      email: true,
      userRole: {
        select: { roleId: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: performedBy,
      userEmail: performer?.email || "system",
      userRole: performer?.userRole?.roleId || "system",
      action,
      actionCategory: "USER_MANAGEMENT",
      entityType: "USER",
      entityId: targetUserId,
      oldValue: changes
        ? changes.reduce(
            (acc, c) => ({ ...acc, [c.field]: c.oldValue }),
            {} as Record<string, any>
          )
        : undefined,
      newValue: changes
        ? changes.reduce(
            (acc, c) => ({ ...acc, [c.field]: c.newValue }),
            {} as Record<string, any>
          )
        : undefined,
      changesSummary: changes
        ? changes
            .map((c) => `${c.field}: ${c.oldValue} → ${c.newValue}`)
            .join(", ")
        : null,
      reason: metadata?.reason || action,
    },
  });
};

/**
 * Log user creation
 */
export const logUserCreated = async (
  performedBy: string,
  userId: string,
  userData: any
) => {
  await createAuditLog({
    action: AuditAction.USER_CREATED,
    performedBy,
    targetUserId: userId,
    metadata: {
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
    },
  });
};

/**
 * Log user update
 */
export const logUserUpdated = async (
  performedBy: string,
  userId: string,
  oldData: any,
  newData: any
) => {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];

  if (oldData.fullName !== newData.fullName) {
    changes.push({
      field: "fullName",
      oldValue: oldData.fullName,
      newValue: newData.fullName,
    });
  }

  if (oldData.email !== newData.email) {
    changes.push({
      field: "email",
      oldValue: oldData.email,
      newValue: newData.email,
    });
  }

  if (oldData.isActive !== newData.isActive) {
    changes.push({
      field: "isActive",
      oldValue: oldData.isActive,
      newValue: newData.isActive,
    });
  }

  if (changes.length > 0) {
    await createAuditLog({
      action: AuditAction.USER_UPDATED,
      performedBy,
      targetUserId: userId,
      changes,
    });
  }
};

/**
 * Log role change
 */
export const logRoleChanged = async (
  performedBy: string,
  userId: string,
  oldRole: string,
  newRole: string
) => {
  await createAuditLog({
    action: AuditAction.USER_ROLE_CHANGED,
    performedBy,
    targetUserId: userId,
    changes: [
      {
        field: "role",
        oldValue: oldRole,
        newValue: newRole,
      },
    ],
  });
};

/**
 * Log password change
 */
export const logPasswordChanged = async (
  performedBy: string,
  userId: string
) => {
  await createAuditLog({
    action: AuditAction.USER_PASSWORD_CHANGED,
    performedBy,
    targetUserId: userId,
    metadata: {
      changedAt: new Date().toISOString(),
    },
  });
};

/**
 * Log user deletion
 */
export const logUserDeleted = async (
  performedBy: string,
  userId: string,
  permanent: boolean
) => {
  await createAuditLog({
    action: permanent ? AuditAction.USER_DELETED : AuditAction.USER_DEACTIVATED,
    performedBy,
    targetUserId: userId,
    metadata: {
      permanent,
    },
  });
};

/**
 * Get audit logs for a user
 */
export const getUserAuditLogs = async (userId: string, limit: number = 50) => {
  return prisma.auditLog.findMany({
    where: {
      entityId: userId,
      entityType: "USER",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
};
