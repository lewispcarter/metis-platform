-- WEBHOOK ROUTE ADMINISTRATION AND PROVIDER SETTINGS
-- Purpose: Adds provider configuration records for production communication setup surfaces.

CREATE TABLE IF NOT EXISTS "provider_configuration" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DISABLED',
  "display_name" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "provider_configuration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_provider_configuration_org_provider_channel"
  ON "provider_configuration"("organization_id", "provider", "channel");

CREATE INDEX IF NOT EXISTS "idx_provider_configuration_org_status"
  ON "provider_configuration"("organization_id", "status");

ALTER TABLE "provider_configuration"
  ADD CONSTRAINT "provider_configuration_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
