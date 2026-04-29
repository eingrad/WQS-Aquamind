/**
 * Validation schemas for telemetry API endpoints
 */

import { z } from "zod";

// ... (keep existing schemas)

/**
 * Schema for raw 5-second sensor reading
 * NEW: For /api/sensors/raw endpoint
 */
export const rawReadingSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  timestamp: z.string().datetime("Invalid ISO timestamp"),
  readings: z.object({
    so2: z.number().optional(),
    h2s: z.number().optional(),
    no2: z.number().optional(),
    no: z.number().optional(),
    nox: z.number().optional(),
    benzene: z.number().optional(),
    toluene: z.number().optional(),
    ethylbenzene: z.number().optional(),
    mp_xylene: z.number().optional(),
    o_xylene: z.number().optional(),
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    windSpeed: z.number().optional(),
    windDirection: z.number().min(0).max(360).optional(),
    solar: z.number().optional(),
    pressure: z.number().optional(),
    rain: z.number().optional(),
  }),
});
