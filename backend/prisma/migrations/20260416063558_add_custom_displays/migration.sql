-- CreateTable
CREATE TABLE "custom_displays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "device_id" UUID NOT NULL,
    "config" JSONB NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_displays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_displays_slug_key" ON "custom_displays"("slug");

-- CreateIndex
CREATE INDEX "idx_display_slug" ON "custom_displays"("slug");

-- CreateIndex
CREATE INDEX "idx_display_creator" ON "custom_displays"("created_by");

-- AddForeignKey
ALTER TABLE "custom_displays" ADD CONSTRAINT "custom_displays_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_displays" ADD CONSTRAINT "custom_displays_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
