import prisma from "../config/database";

export enum AuditAction {
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  USER_DEACTIVATED = "USER_DEACTIVATED",
  USER_ACTIVATED = "USER_ACTIVATED",
  FLAG_REQUESTED = "FLAG_REQUESTED",
  FLAG_APPROVED = "FLAG_APPROVED",
  FLAG_REJECTED = "FLAG_REJECTED",
  THRESHOLD_CREATED = "THRESHOLD_CREATED",
  THRESHOLD_UPDATED = "THRESHOLD_UPDATED",
  THRESHOLD_DELETED = "THRESHOLD_DELETED",
  THRESHOLD_ENABLED = "THRESHOLD_ENABLED",
  THRESHOLD_DISABLED = "THRESHOLD_DISABLED",
  ALERT_TRIGGERED = "ALERT_TRIGGERED",
  ALERT_ACKNOWLEDGED = "ALERT_ACKNOWLEDGED",
  CALIBRATION_UPDATED = "CALIBRATION_UPDATED",
}

interface AuditLogData {
  action: AuditAction;
  performedBy: string; // User ID who performed the action
  targetUserId?: string; // User ID affected by the action (optional for validation actions)
  actionCategory?: string; // Category of the action (USER_MANAGEMENT, VALIDATION, etc.)
  entityType?: string; // Type of entity (USER, APPROVAL_REQUEST, etc.)
  entityId?: string; // ID of the entity
  approvalReference?: string; // Reference to the approval request
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
  const {
    action,
    performedBy,
    targetUserId,
    actionCategory = "USER_MANAGEMENT",
    entityType = "USER",
    entityId,
    approvalReference,
    changes,
    metadata,
  } = data;

  // Get performer details (skip lookup for system actions)
  let performer = null;
  if (performedBy !== "system") {
    performer = await prisma.user.findUnique({
      where: { id: performedBy },
      select: {
        email: true,
        userRole: {
          select: { roleId: true },
        },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: performedBy === "system" ? null : performedBy,
      userEmail: performer?.email || "system",
      userRole: performer?.userRole?.roleId || "system",
      action,
      actionCategory,
      entityType,
      entityId: entityId || targetUserId || performedBy,
      approvalReference,
      oldValue: changes
        ? changes.reduce(
            (acc, c) => ({ ...acc, [c.field]: c.oldValue }),
            {} as Record<string, any>,
          )
        : undefined,
      newValue: changes
        ? changes.reduce(
            (acc, c) => ({ ...acc, [c.field]: c.newValue }),
            {} as Record<string, any>,
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
  userData: any,
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
  newData: any,
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
  newRole: string,
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
  userId: string,
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
  permanent: boolean,
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

/**
 * Log flag request creation (QC user submits)
 */
export const logFlagRequested = async (
  qcUserId: string,
  approvalId: string,
  metadata: {
    deviceId: string;
    parameter: string;
    flagType: string;
    timeRange: { from: Date; to: Date };
    recordCount: number;
    qcRemarks: string;
  },
) => {
  await createAuditLog({
    action: AuditAction.FLAG_REQUESTED,
    performedBy: qcUserId,
    actionCategory: "VALIDATION",
    entityType: "APPROVAL_REQUEST",
    entityId: approvalId,
    approvalReference: approvalId,
    metadata: {
      deviceId: metadata.deviceId,
      parameter: metadata.parameter,
      flagType: metadata.flagType,
      timeFrom: metadata.timeRange.from.toISOString(),
      timeTo: metadata.timeRange.to.toISOString(),
      recordCount: metadata.recordCount,
      qcRemarks: metadata.qcRemarks,
      reason: `Requested ${metadata.flagType} flag for ${metadata.parameter} (${metadata.recordCount} records). Reason: ${metadata.qcRemarks}`,
    },
  });
};

/**
 * Log flag approval
 */
export const logFlagApproved = async (
  adminId: string,
  approvalId: string,
  metadata: {
    deviceId: string;
    parameter: string;
    flagType: string;
    timeRange: { from: Date; to: Date };
    recordCount: number;
    adminRemarks?: string;
  },
) => {
  await createAuditLog({
    action: AuditAction.FLAG_APPROVED,
    performedBy: adminId,
    actionCategory: "VALIDATION",
    entityType: "APPROVAL_REQUEST",
    entityId: approvalId,
    approvalReference: approvalId,
    metadata: {
      deviceId: metadata.deviceId,
      parameter: metadata.parameter,
      flagType: metadata.flagType,
      timeFrom: metadata.timeRange.from.toISOString(),
      timeTo: metadata.timeRange.to.toISOString(),
      recordCount: metadata.recordCount,
      adminRemarks: metadata.adminRemarks,
      reason: `Approved ${metadata.flagType} flag for ${metadata.parameter} (${metadata.recordCount} records affected)`,
    },
  });
};

/**
 * Log flag rejection
 */
export const logFlagRejected = async (
  adminId: string,
  approvalId: string,
  metadata: {
    deviceId: string;
    parameter: string;
    flagType: string;
    timeRange: { from: Date; to: Date };
    adminRemarks: string;
  },
) => {
  await createAuditLog({
    action: AuditAction.FLAG_REJECTED,
    performedBy: adminId,
    actionCategory: "VALIDATION",
    entityType: "APPROVAL_REQUEST",
    entityId: approvalId,
    approvalReference: approvalId,
    metadata: {
      deviceId: metadata.deviceId,
      parameter: metadata.parameter,
      flagType: metadata.flagType,
      timeFrom: metadata.timeRange.from.toISOString(),
      timeTo: metadata.timeRange.to.toISOString(),
      adminRemarks: metadata.adminRemarks,
      reason: `Rejected ${metadata.flagType} flag for ${metadata.parameter}. Reason: ${metadata.adminRemarks}`,
    },
  });
};

/**
 * Log threshold creation
 */
export const logThresholdCreated = async (
  adminId: string,
  thresholdId: string,
  metadata: {
    deviceId: string;
    parameter: string;
    thresholdType: string;
    operator: string;
    value: string;
    cooldownMinutes: number;
  },
) => {
  await createAuditLog({
    action: AuditAction.THRESHOLD_CREATED,
    performedBy: adminId,
    actionCategory: "ALERT_MANAGEMENT",
    entityType: "ALERT_THRESHOLD",
    entityId: thresholdId,
    metadata: {
      ...metadata,
      reason: `Created ${metadata.thresholdType} threshold: ${metadata.parameter} ${metadata.operator} ${metadata.value} for device ${metadata.deviceId}`,
    },
  });
};

/**
 * Log threshold update
 */
export const logThresholdUpdated = async (
  adminId: string,
  thresholdId: string,
  changes: { field: string; oldValue: any; newValue: any }[],
) => {
  await createAuditLog({
    action: AuditAction.THRESHOLD_UPDATED,
    performedBy: adminId,
    actionCategory: "ALERT_MANAGEMENT",
    entityType: "ALERT_THRESHOLD",
    entityId: thresholdId,
    changes,
    metadata: {
      reason: `Updated threshold configuration`,
    },
  });
};

/**
 * Log threshold deletion
 */
export const logThresholdDeleted = async (
  adminId: string,
  thresholdId: string,
  metadata: {
    deviceId: string;
    parameter: string;
    thresholdType: string;
    operator: string;
    value: string;
  },
) => {
  await createAuditLog({
    action: AuditAction.THRESHOLD_DELETED,
    performedBy: adminId,
    actionCategory: "ALERT_MANAGEMENT",
    entityType: "ALERT_THRESHOLD",
    entityId: thresholdId,
    metadata: {
      ...metadata,
      reason: `Deleted ${metadata.thresholdType} threshold: ${metadata.parameter} ${metadata.operator} ${metadata.value}`,
    },
  });
};

/**
 * Log threshold enabled
 */
export const logThresholdEnabled = async (
  adminId: string,
  thresholdId: string,
) => {
  await createAuditLog({
    action: AuditAction.THRESHOLD_ENABLED,
    performedBy: adminId,
    actionCategory: "ALERT_MANAGEMENT",
    entityType: "ALERT_THRESHOLD",
    entityId: thresholdId,
    metadata: {
      reason: `Enabled alert threshold`,
    },
  });
};

/**
 * Log threshold disabled
 */
export const logThresholdDisabled = async (
  adminId: string,
  thresholdId: string,
) => {
  await createAuditLog({
    action: AuditAction.THRESHOLD_DISABLED,
    performedBy: adminId,
    actionCategory: "ALERT_MANAGEMENT",
    entityType: "ALERT_THRESHOLD",
    entityId: thresholdId,
    metadata: {
      reason: `Disabled alert threshold`,
    },
  });
};

/**
 * Log alert triggered
 */
export const logAlertTriggered = async (
  alertHistoryId: string,
  metadata: {
    deviceId: string;
    parameter: string;
    thresholdType: string;
    actualValue: number;
    thresholdValue: number;
  },
) => {
  await createAuditLog({
    action: AuditAction.ALERT_TRIGGERED,
    performedBy: "system",
    actionCategory: "ALERT_NOTIFICATION",
    entityType: "ALERT_HISTORY",
    entityId: alertHistoryId,
    metadata: {
      ...metadata,
      reason: `Alert triggered: ${metadata.parameter} = ${metadata.actualValue} (threshold: ${metadata.thresholdValue}, type: ${metadata.thresholdType})`,
    },
  });
};

/**
 * Log alert acknowledged
 */
export const logAlertAcknowledged = async (
  userId: string,
  alertHistoryId: string,
) => {
  await createAuditLog({
    action: AuditAction.ALERT_ACKNOWLEDGED,
    performedBy: userId,
    actionCategory: "ALERT_NOTIFICATION",
    entityType: "ALERT_HISTORY",
    entityId: alertHistoryId,
    metadata: {
      reason: `Acknowledged alert`,
    },
  });
};
