/**
 * Telemetry Service
 * Main service file that exports all telemetry-related functions
 */

// Re-export validation and parameter utilities
export { PARAMETER_RANGES } from "./telemetry/validation/parameter-ranges";
export { validateParameterValues } from "./telemetry/validation/parameter-validator";
export {
  PARAMETER_DB_MAP,
  PARAMETER_UNITS,
} from "./telemetry/queries/parameter-mapping";

// Import and re-export database operations
export { createReading, createReadingsBulk } from "./telemetry/operations/crud";
export {
  getReadings,
  getReadingById,
  getLatestReadings,
  getLatestReading, // For device activity check
} from "./telemetry/operations/query";
export {
  getTimeSeriesData,
  getHourlyAverages,
} from "./telemetry/operations/aggregation";
