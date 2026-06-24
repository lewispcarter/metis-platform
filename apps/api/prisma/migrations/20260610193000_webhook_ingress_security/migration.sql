-- WEBHOOK INGRESS SECURITY MIGRATION
-- Purpose: Adds provider-address tenant routing for secure inbound webhook processing.

CREATE TABLE "inbound_webhook_route" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "inbound_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbound_webhook_route_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_inbound_webhook_route_provider_address" ON "inbound_webhook_route"("provider", "inbound_address");
CREATE INDEX "idx_inbound_webhook_route_org_status" ON "inbound_webhook_route"("organization_id", "status");

ALTER TABLE "inbound_webhook_route"
ADD CONSTRAINT "inbound_webhook_route_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
