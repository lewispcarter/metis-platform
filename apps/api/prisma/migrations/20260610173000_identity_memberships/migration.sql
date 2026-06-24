-- IDENTITY MEMBERSHIP MIGRATION
-- Purpose: Adds database-backed organization memberships for provider-agnostic RBAC and audit attribution.
-- Role: Allows Clerk/Auth0 users to be synchronized into platform-owned identity records without coupling domain modules to an external identity provider.

CREATE TABLE IF NOT EXISTS "organization_membership" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_membership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_org_membership_org_user" ON "organization_membership"("organization_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_org_membership_org_role" ON "organization_membership"("organization_id", "role_name");
CREATE INDEX IF NOT EXISTS "idx_org_membership_user" ON "organization_membership"("user_id");

ALTER TABLE "organization_membership"
ADD CONSTRAINT "organization_membership_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_membership"
ADD CONSTRAINT "organization_membership_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
