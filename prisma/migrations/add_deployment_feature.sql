-- ============================================================
-- Migration: add_deployment_feature
-- Run on VPS: psql $DATABASE_URL -f this_file.sql
-- ============================================================

-- 1. Add deployment fields to users table
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "deployment_limit"     INT     NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "is_deployment_frozen" BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create deployments table
CREATE TABLE IF NOT EXISTS "deployments" (
  "id"             TEXT         NOT NULL,
  "user_id"        TEXT         NOT NULL,
  "subdomain"      TEXT         NOT NULL,
  "display_name"   TEXT         NOT NULL DEFAULT '',
  "folder_path"    TEXT         NOT NULL,
  "live_url"       TEXT         NOT NULL,
  "total_visitors" INTEGER      NOT NULL DEFAULT 0,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- 3. Unique constraint on subdomain
ALTER TABLE "deployments"
  ADD CONSTRAINT IF NOT EXISTS "deployments_subdomain_key" UNIQUE ("subdomain");

-- 4. Foreign key: deployments.user_id → users.id (cascade delete)
ALTER TABLE "deployments"
  ADD CONSTRAINT IF NOT EXISTS "deployments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 5. Indexes on deployments
CREATE INDEX IF NOT EXISTS "deployments_user_id_idx"  ON "deployments"("user_id");
CREATE INDEX IF NOT EXISTS "deployments_subdomain_idx" ON "deployments"("subdomain");

-- 6. Create visitor_logs table
CREATE TABLE IF NOT EXISTS "visitor_logs" (
  "id"            TEXT         NOT NULL,
  "deployment_id" TEXT         NOT NULL,
  "visitor_ip"    TEXT         NOT NULL,
  "user_agent"    TEXT,
  "date"          TEXT         NOT NULL,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "visitor_logs_pkey" PRIMARY KEY ("id")
);

-- 7. Foreign key: visitor_logs.deployment_id → deployments.id (cascade delete)
ALTER TABLE "visitor_logs"
  ADD CONSTRAINT IF NOT EXISTS "visitor_logs_deployment_id_fkey"
  FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE;

-- 8. Indexes on visitor_logs
CREATE INDEX IF NOT EXISTS "visitor_logs_deployment_id_idx" ON "visitor_logs"("deployment_id");
CREATE INDEX IF NOT EXISTS "visitor_logs_date_idx"          ON "visitor_logs"("date");

-- 9. Auto-update updated_at on deployments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_deployments_updated_at ON "deployments";
CREATE TRIGGER update_deployments_updated_at
  BEFORE UPDATE ON "deployments"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done!
SELECT 'Migration add_deployment_feature applied successfully.' AS status;
