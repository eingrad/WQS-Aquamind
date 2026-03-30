-- DropForeignKey
ALTER TABLE "alert_thresholds" DROP CONSTRAINT "alert_thresholds_created_by_fkey";

-- DropForeignKey
ALTER TABLE "approval_requests" DROP CONSTRAINT "approval_requests_qc_reviewer_id_fkey";

-- AlterTable
ALTER TABLE "alert_thresholds" ALTER COLUMN "created_by" DROP NOT NULL;

-- AlterTable
ALTER TABLE "approval_requests" ALTER COLUMN "qc_reviewer_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_qc_reviewer_id_fkey" FOREIGN KEY ("qc_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_thresholds" ADD CONSTRAINT "alert_thresholds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
