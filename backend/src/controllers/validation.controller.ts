import { Request, Response, NextFunction } from "express";
import * as validationService from "../services/validation.service";
import { z } from "zod";

/**
 * Validation schema for validation table query
 */
const validationTableQuerySchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 100)),
});

/**
 * Get validation table data (1-hour aggregated data for regulatory compliance)
 * GET /api/validation/table-data
 */
export const getValidationTableData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedQuery = validationTableQuerySchema.parse(req.query);

    const data = await validationService.getValidationTableData({
      deviceId: validatedQuery.deviceId,
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    });

    res.json({
      success: true,
      data,
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

export default {
  getValidationTableData,
};
