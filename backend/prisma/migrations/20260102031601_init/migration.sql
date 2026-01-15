-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_login" TIMESTAMPTZ,
    "lock_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" VARCHAR(50) NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_raw" (
    "raw_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID NOT NULL,
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "protocol" VARCHAR(20) NOT NULL,
    "checksum" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_raw_pkey" PRIMARY KEY ("raw_id")
);

-- CreateTable
CREATE TABLE "telemetry_processed" (
    "record_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID NOT NULL,
    "raw_id" UUID,
    "observed_at" TIMESTAMPTZ NOT NULL,
    "so2_value" DECIMAL(10,2),
    "h2s_value" DECIMAL(10,2),
    "no2_value" DECIMAL(10,2),
    "btex_value" DECIMAL(10,2),
    "temp_value" DECIMAL(5,2),
    "humidity_value" DECIMAL(5,2),
    "ws_value" DECIMAL(5,2),
    "wd_value" DECIMAL(5,2),
    "solar_value" DECIMAL(7,2),
    "data_quality" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "processing_flags" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_processed_pkey" PRIMARY KEY ("observed_at","device_id","record_id")
);

-- CreateTable
CREATE TABLE "validation_status" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "record_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "observed_at" TIMESTAMPTZ NOT NULL,
    "parameter" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "validated_by_human" BOOLEAN NOT NULL DEFAULT false,
    "flagged_by_human" BOOLEAN NOT NULL DEFAULT false,
    "pending_admin_approval" BOOLEAN NOT NULL DEFAULT false,
    "validated_by" UUID,
    "validated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "approval_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "station_id" UUID NOT NULL,
    "parameter_code" VARCHAR(50) NOT NULL,
    "time_from" TIMESTAMPTZ NOT NULL,
    "time_to" TIMESTAMPTZ NOT NULL,
    "record_id" UUID,
    "approval_type" VARCHAR(50),
    "current_value" DECIMAL(10,2),
    "new_value" DECIMAL(10,2),
    "previous_value" DECIMAL(10,2),
    "flag_type" VARCHAR(50),
    "validation_type" VARCHAR(50),
    "validation_mode" VARCHAR(50),
    "qc_reviewer_id" UUID NOT NULL,
    "qc_reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qc_remarks" TEXT,
    "admin_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "admin_id" UUID,
    "admin_decided_at" TIMESTAMPTZ,
    "admin_remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("approval_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "user_email" VARCHAR(255) NOT NULL,
    "user_role" VARCHAR(50) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "action_category" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changes_summary" TEXT,
    "reason" TEXT NOT NULL,
    "justification_category" VARCHAR(50),
    "approval_reference" UUID,
    "ip_address" INET,
    "user_agent" TEXT,
    "request_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retention_until" TIMESTAMPTZ,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "related_entity_type" VARCHAR(50),
    "related_entity_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "time_from" TIMESTAMPTZ NOT NULL,
    "time_to" TIMESTAMPTZ NOT NULL,
    "device_ids" UUID[],
    "parameters" VARCHAR(50)[],
    "file_format" VARCHAR(10) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
    "error_message" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_user_roles_role" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_code_key" ON "devices"("device_code");

-- CreateIndex
CREATE INDEX "idx_telemetry_raw_device" ON "telemetry_raw"("device_id", "received_at" DESC);

-- CreateIndex
CREATE INDEX "idx_telemetry_raw_received" ON "telemetry_raw"("received_at" DESC);

-- CreateIndex
CREATE INDEX "idx_telemetry_processed_device" ON "telemetry_processed"("device_id", "observed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_telemetry_processed_time" ON "telemetry_processed"("observed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_telemetry_processed_quality" ON "telemetry_processed"("data_quality", "observed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "telemetry_processed_record_id_key" ON "telemetry_processed"("record_id");

-- CreateIndex
CREATE INDEX "idx_validation_device_time" ON "validation_status"("device_id", "observed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_validation_status" ON "validation_status"("status");

-- CreateIndex
CREATE INDEX "idx_validation_pending" ON "validation_status"("pending_admin_approval");

-- CreateIndex
CREATE INDEX "idx_validation_record" ON "validation_status"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "validation_status_record_id_parameter_key" ON "validation_status"("record_id", "parameter");

-- CreateIndex
CREATE INDEX "idx_approval_status" ON "approval_requests"("admin_status");

-- CreateIndex
CREATE INDEX "idx_approval_station_time" ON "approval_requests"("station_id", "time_from" DESC);

-- CreateIndex
CREATE INDEX "idx_approval_qc_reviewer" ON "approval_requests"("qc_reviewer_id");

-- CreateIndex
CREATE INDEX "idx_approval_admin" ON "approval_requests"("admin_id");

-- CreateIndex
CREATE INDEX "idx_approval_record" ON "approval_requests"("record_id");

-- CreateIndex
CREATE INDEX "idx_approval_time_range" ON "approval_requests"("time_from", "time_to");

-- CreateIndex
CREATE INDEX "idx_audit_user" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_timestamp" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_category" ON "audit_logs"("action_category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_approval_ref" ON "audit_logs"("approval_reference");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notifications_unread" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_reports_created_by" ON "reports"("created_by", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_reports_type" ON "reports"("report_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_reports_status" ON "reports"("status");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_raw" ADD CONSTRAINT "telemetry_raw_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_processed" ADD CONSTRAINT "telemetry_processed_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_processed" ADD CONSTRAINT "telemetry_processed_raw_id_fkey" FOREIGN KEY ("raw_id") REFERENCES "telemetry_raw"("raw_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_status" ADD CONSTRAINT "validation_status_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "telemetry_processed"("record_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_status" ADD CONSTRAINT "validation_status_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_status" ADD CONSTRAINT "validation_status_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "telemetry_processed"("record_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_qc_reviewer_id_fkey" FOREIGN KEY ("qc_reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_approval_reference_fkey" FOREIGN KEY ("approval_reference") REFERENCES "approval_requests"("approval_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
