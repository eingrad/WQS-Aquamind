-- CreateTable
CREATE TABLE "maintenance_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "reason" VARCHAR(100),
    "description" TEXT,
    "performed_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_maintenance_device_time" ON "maintenance_log"("device_id", "start_time" DESC);

-- CreateIndex
CREATE INDEX "idx_maintenance_time_range" ON "maintenance_log"("start_time", "end_time");

-- AddForeignKey
ALTER TABLE "maintenance_log" ADD CONSTRAINT "maintenance_log_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
