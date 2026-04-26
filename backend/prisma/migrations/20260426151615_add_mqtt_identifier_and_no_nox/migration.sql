/*
  Warnings:

  - A unique constraint covering the columns `[mqtt_identifier]` on the table `devices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "mqtt_identifier" VARCHAR(255);

-- AlterTable
ALTER TABLE "telemetry_processed" ADD COLUMN     "no_value" DECIMAL(10,2),
ADD COLUMN     "nox_value" DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "devices_mqtt_identifier_key" ON "devices"("mqtt_identifier");
