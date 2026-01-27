import api from "./api";

/**
 * Approval-related API calls
 */

export interface PendingApprovalRequest {
  approvalId: string;
  device: {
    id: string;
    name: string;
    location: string;
  };
  parameter: string;
  flagType: string;
  status?: string; // Added status field for all approvals
  timeRange: {
    from: string;
    to: string;
  };
  requestedBy: {
    name: string;
    email: string;
  };
  requestedAt: string;
  qcRemarks: string;
  recordCount: number;
  hourlyValue: number | null;
  adminRemarks?: string;
  decidedAt?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Fetch all pending approval requests
 */
export async function fetchPendingApprovals(): Promise<
  PendingApprovalRequest[]
> {
  const response = await api.get<{ data: PendingApprovalRequest[] }>(
    "/validation/pending-approvals",
  );
  return response.data.data;
}

/**
 * Fetch all approval requests (pending, approved, rejected)
 */
export async function fetchAllApprovals(
  status?: "all" | "pending" | "approved" | "rejected",
): Promise<PendingApprovalRequest[]> {
  const params = status && status !== "all" ? { status } : {};
  const response = await api.get<{ data: PendingApprovalRequest[] }>(
    "/validation/all-approvals",
    { params },
  );
  return response.data.data;
}

/**
 * Approve a flag request
 */
export async function approveFlag(
  approvalId: string,
  adminRemarks?: string,
): Promise<ApprovalResponse> {
  const response = await api.post<ApprovalResponse>(
    "/validation/approve-flag",
    {
      approvalId,
      adminRemarks: adminRemarks || "",
    },
  );
  return response.data;
}

/**
 * Reject a flag request
 */
export async function rejectFlag(
  approvalId: string,
  adminRemarks?: string,
): Promise<ApprovalResponse> {
  const response = await api.post<ApprovalResponse>("/validation/reject-flag", {
    approvalId,
    adminRemarks: adminRemarks || "",
  });
  return response.data;
}

/**
 * Fetch user's own approval requests
 */
export async function fetchMyRequests(): Promise<PendingApprovalRequest[]> {
  const response = await api.get<{ data: PendingApprovalRequest[] }>(
    "/validation/my-requests",
  );
  return response.data.data;
}
