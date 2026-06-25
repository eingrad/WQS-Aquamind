-- AlterTable
ALTER TABLE "telemetry_processed" ADD COLUMN     "raw_values" JSONB;

-- CreateTable
CREATE TABLE "sensor_calibration" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID NOT NULL,
    "parameter" VARCHAR(20) NOT NULL,
    "slope" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "offset" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_calibration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_calibration_device" ON "sensor_calibration"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_calibration_device_param" ON "sensor_calibration"("device_id", "parameter");

-- AddForeignKey
ALTER TABLE "sensor_calibration" ADD CONSTRAINT "sensor_calibration_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_calibration" ADD CONSTRAINT "sensor_calibration_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
