-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "alert_history_id" UUID,
ADD COLUMN     "severity" VARCHAR(20);

-- CreateTable
CREATE TABLE "alert_thresholds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID,
    "parameter" VARCHAR(50) NOT NULL,
    "threshold_type" VARCHAR(20) NOT NULL,
    "operator" VARCHAR(10) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 60,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "threshold_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "parameter" VARCHAR(50) NOT NULL,
    "record_id" UUID,
    "observed_at" TIMESTAMPTZ NOT NULL,
    "actual_value" DECIMAL(10,2) NOT NULL,
    "threshold_value" DECIMAL(10,2) NOT NULL,
    "threshold_type" VARCHAR(20) NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "notify_in_app" BOOLEAN NOT NULL DEFAULT true,
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "notify_telegram" BOOLEAN NOT NULL DEFAULT true,
    "telegram_chat_id" VARCHAR(255),
    "email_address" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_threshold_parameter" ON "alert_thresholds"("parameter", "enabled");

-- CreateIndex
CREATE INDEX "idx_threshold_device_param" ON "alert_thresholds"("device_id", "parameter");

-- CreateIndex
CREATE INDEX "idx_alert_threshold" ON "alert_history"("threshold_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_alert_device_param" ON "alert_history"("device_id", "parameter", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_alert_acknowledged" ON "alert_history"("acknowledged");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_user_id_key" ON "user_notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_history_id_fkey" FOREIGN KEY ("alert_history_id") REFERENCES "alert_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_thresholds" ADD CONSTRAINT "alert_thresholds_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_thresholds" ADD CONSTRAINT "alert_thresholds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_threshold_id_fkey" FOREIGN KEY ("threshold_id") REFERENCES "alert_thresholds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "telemetry_processed"("record_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
