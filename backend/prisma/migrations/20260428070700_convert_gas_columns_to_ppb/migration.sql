/*
  Warnings:

  - You are about to alter the column `so2_value` on the `telemetry_processed` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `Decimal(11,4)`.
  - You are about to alter the column `h2s_value` on the `telemetry_processed` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `Decimal(11,4)`.
  - You are about to alter the column `no2_value` on the `telemetry_processed` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `Decimal(11,4)`.
  - You are about to alter the column `btex_value` on the `telemetry_processed` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `Decimal(11,4)`.
  - You are about to alter the column `no_value` on the `telemetry_processed` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `Decimal(11,4)`.
  - You are about to alter the column `nox_value` on the `telemetry_processed` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,6)` to `Decimal(11,4)`.

*/
-- AlterTable
ALTER TABLE "telemetry_processed" ALTER COLUMN "so2_value" SET DATA TYPE DECIMAL(11,4),
ALTER COLUMN "h2s_value" SET DATA TYPE DECIMAL(11,4),
ALTER COLUMN "no2_value" SET DATA TYPE DECIMAL(11,4),
ALTER COLUMN "btex_value" SET DATA TYPE DECIMAL(11,4),
ALTER COLUMN "no_value" SET DATA TYPE DECIMAL(11,4),
ALTER COLUMN "nox_value" SET DATA TYPE DECIMAL(11,4);
