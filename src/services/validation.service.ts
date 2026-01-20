import api from "./api";

/**
 * Validation table data types
 */
export interface ValidationParameter {
  value: number;
  unit: string;
  autoFlag: string;
  humanValidation?: {
    status: string;
    validatedByHuman: boolean;
    flaggedByHuman: boolean;
    pendingApproval: boolean;
    validatedBy: {
      name: string;
      email: string;
    } | null;
    validatedAt: string | null;
  };
  pendingApproval?: {
    isPending: boolean;
    requestedBy: {
      name: string;
      email: string;
    };
    requestedAt: string;
    remarks: string | null;
    flagType: string;
  } | null;
}

export interface ValidationRecord {
  recordId: string;
  deviceId: string;
  deviceName: string;
  location: string;
  timestamp: string;
  parameters: Record<string, ValidationParameter>;
  dataQuality: string;
  createdAt: string;
}

export interface ValidationTableResponse {
  records: ValidationRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get validation table data (1-minute data for QA/QC)
 */
export const getValidationTableData = async (params: {
  deviceId: string;
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}): Promise<ValidationTableResponse> => {
  const response = await api.get("/validation/table-data", { params });
  return response.data.data;
};

export default {
  getValidationTableData,
};
