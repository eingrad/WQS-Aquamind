-- AlterTable
ALTER TABLE "telemetry_processed" ADD COLUMN     "pressure_value" DECIMAL(7,2),
ADD COLUMN     "rain_value" DECIMAL(6,2);
