import { z } from "zod";

/**
 * Register request validation schema
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    ),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["admin", "user", "qa_qc", "technician"], {
    message: "Invalid role. Must be: admin, user, qa_qc, or technician",
  }),
});

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Refresh token request validation schema
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * Logout request validation schema
 */
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["admin", "user", "qa_qc", "technician"]).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    ),
});

/**
 * Query parameters for user list
 */
export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  role: z.enum(["admin", "user", "qa_qc", "technician"]).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

/**
 * Create device validation schema
 */
export const createDeviceSchema = z.object({
  deviceCode: z.string().min(1, "Device code is required").max(50),
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  location: z.string().min(2, "Location is required").max(255),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

/**
 * Update device validation schema
 */
export const updateDeviceSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  location: z.string().min(2).max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

/**
 * Device query parameters
 */
export const deviceQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
  search: z.string().optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type DeviceQuery = z.infer<typeof deviceQuerySchema>;

/**
 * Create sensor reading validation schema
 */
export const createReadingSchema = z.object({
  deviceId: z
    .string()
    .refine(
      (val) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val
        ),
      { message: "Device ID must be a valid UUID" }
    ),
  observedAt: z.string().refine(
    (val) => {
      // Accept various ISO 8601 formats:
      // - 2026-01-05T18:00:00 (timezone-naive, local time)
      // - 2026-01-05T10:00:00Z (UTC)
      // - 2026-01-05T18:00:00+08:00 (with offset)
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "observedAt must be a valid ISO 8601 timestamp" }
  ),
  readings: z.object({
    ph: z.number().optional(),
    do: z.number().optional(),
    nh3n: z.number().optional(),
    cod: z.number().optional(),
    bod: z.number().optional(),
    tss: z.number().optional(),
    temperature: z.number().optional(),
    pressure: z.number().optional(),
    depth: z.number().optional(),
  }),
});

/**
 * Bulk readings validation schema
 */
export const bulkReadingsSchema = z.object({
  readings: z.array(createReadingSchema).min(1).max(100),
});

/**
 * Readings query parameters
 */
export const readingsQuerySchema = z.object({
  deviceId: z
    .string()
    .refine(
      (val) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val
        ),
      { message: "Invalid UUID" }
    )
    .optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional(),
  parameter: z
    .enum([
      "ph",
      "do",
      "nh3n",
      "cod",
      "bod",
      "tss",
      "temperature",
      "pressure",
      "depth",
    ])
    .optional(),
  dataQuality: z.enum(["pending", "valid", "invalid", "flagged"]).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val) || 100, 1000) : 100)),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
export type BulkReadingsInput = z.infer<typeof bulkReadingsSchema>;
export type ReadingsQuery = z.infer<typeof readingsQuerySchema>;

/**
 * Time-series query parameters
 */
export const timeSeriesQuerySchema = z.object({
  deviceId: z
    .string()
    .refine(
      (val) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val
        ),
      { message: "Invalid device ID" }
    ),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  interval: z
    .enum(["raw", "1m", "30m", "1h", "8h", "8h_ma", "24h", "24h_ma"])
    .optional()
    .default("1h"),
  parameters: z.string().optional(), // Comma-separated: so2,no2,temperature
});

/**
 * Hourly average query parameters
 */
export const hourlyAvgQuerySchema = z.object({
  deviceId: z
    .string()
    .refine(
      (val) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val
        ),
      { message: "Invalid device ID" }
    ),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  parameter: z.enum([
    "ph",
    "do",
    "nh3n",
    "cod",
    "bod",
    "tss",
    "temperature",
    "pressure",
    "depth",
  ]),
});

export type TimeSeriesQuery = z.infer<typeof timeSeriesQuerySchema>;
export type HourlyAvgQuery = z.infer<typeof hourlyAvgQuerySchema>;

/**
 * Maintenance log validation schemas
 */
export const createMaintenanceSchema = z.object({
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start time format",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end time format",
  }),
  reason: z.string().max(100).optional(),
  description: z.string().optional(),
});

export const maintenanceQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val) || 50, 100) : 50)),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type MaintenanceQuery = z.infer<typeof maintenanceQuerySchema>;
