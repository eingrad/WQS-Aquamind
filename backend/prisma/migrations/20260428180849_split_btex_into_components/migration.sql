-- AlterTable
ALTER TABLE "telemetry_processed" ADD COLUMN     "benzene_value" DECIMAL(11,4),
ADD COLUMN     "ethylbenzene_value" DECIMAL(11,4),
ADD COLUMN     "mp_xylene_value" DECIMAL(11,4),
ADD COLUMN     "o_xylene_value" DECIMAL(11,4),
ADD COLUMN     "toluene_value" DECIMAL(11,4);
