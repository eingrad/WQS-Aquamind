/*
  Warnings:

  - You are about to drop the column `mp_xylene_value` on the `telemetry_processed` table. All the data in the column will be lost.
  - You are about to drop the column `o_xylene_value` on the `telemetry_processed` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "telemetry_processed" DROP COLUMN "mp_xylene_value",
DROP COLUMN "o_xylene_value",
ADD COLUMN     "xylenes_value" DECIMAL(11,4);
