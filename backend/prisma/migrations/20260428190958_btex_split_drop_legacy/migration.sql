/*
  Warnings:

  - You are about to drop the column `btex_value` on the `telemetry_processed` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "telemetry_processed" DROP COLUMN "btex_value";
