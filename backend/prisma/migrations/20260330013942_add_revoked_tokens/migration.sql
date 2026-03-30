-- CreateTable
CREATE TABLE "revoked_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jti" VARCHAR(36) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_jti_key" ON "revoked_tokens"("jti");

-- CreateIndex
CREATE INDEX "idx_revoked_token_jti" ON "revoked_tokens"("jti");

-- CreateIndex
CREATE INDEX "idx_revoked_token_expires" ON "revoked_tokens"("expires_at");
