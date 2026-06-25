-- Switch sensor calibration from a linear slope/offset model to a single
-- operation (multiply/divide/add/subtract/none) + value model.

-- AlterTable
ALTER TABLE "sensor_calibration" ADD COLUMN     "operation" VARCHAR(10) NOT NULL DEFAULT 'none';
ALTER TABLE "sensor_calibration" ADD COLUMN     "value" DECIMAL(12,6) NOT NULL DEFAULT 0;
ALTER TABLE "sensor_calibration" DROP COLUMN "slope";
ALTER TABLE "sensor_calibration" DROP COLUMN "offset";
