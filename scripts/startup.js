/**
 * startup.js — runs before the Next.js server starts.
 * Applies any schema changes that aren't covered by migration files.
 * Safe to run multiple times (uses IF NOT EXISTS / idempotent SQL).
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applySchemaPatches() {
    console.log("[startup] Applying schema patches...");

    // ── Original patches (idempotent) ──────────────────────────

    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::JSONB;
        `);
        console.log("[startup] ✓ users.permissions column OK");
    } catch (err) {
        console.error("[startup] Schema patch error (permissions):", err.message);
    }

    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE batch_students ADD COLUMN IF NOT EXISTS photo TEXT;
        `);
        console.log("[startup] ✓ batch_students.photo column OK");
    } catch (err) {
        console.error("[startup] Schema patch error (photo):", err.message);
    }

    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS routine_configs (
                id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
                batch TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                subtitle TEXT NOT NULL DEFAULT '',
                footer_text TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT routine_configs_pkey PRIMARY KEY (id)
            );
        `);
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS routine_configs_batch_key ON routine_configs(batch);
        `);
        console.log("[startup] ✓ routine_configs table OK");
    } catch (err) {
        console.error("[startup] Schema patch error (routine_configs):", err.message);
    }

    // ── Active sessions table (concurrent login tracking) ──────────
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS active_sessions (
                id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMP(3) NOT NULL,
                created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT active_sessions_pkey PRIMARY KEY (id)
            );
        `);
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS active_sessions_user_id_key ON active_sessions(user_id);
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS active_sessions_expires_at_idx ON active_sessions(expires_at);
        `);
        await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'active_sessions_user_id_fkey'
                ) THEN
                    ALTER TABLE active_sessions
                    ADD CONSTRAINT active_sessions_user_id_fkey
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `);
        console.log("[startup] ✓ active_sessions table OK");
    } catch (err) {
        console.error("[startup] Schema patch error (active_sessions):", err.message);
    }

    // ── Remove tenant system (idempotent cleanup) ───────────────

    const tablesWithTenantId = [
        "users", "teachers", "classes", "class_schedules", "batches",
        "batch_students", "notices", "student_notices", "homework_submissions",
        "homework_assignments", "feedback", "contact_messages", "chat_threads",
        "activity_logs", "resources", "module_folders", "module_resources",
        "posts", "exam_results", "routines", "policies", "cms_content",
        "success_stories", "video_testimonials", "daily_tracker_reports",
        "student_update_requests", "batch_routine_entries", "routine_configs",
        "student_exam_batch_records", "course_modules", "video_stories",
    ];

    for (const table of tablesWithTenantId) {
        try {
            await prisma.$executeRawUnsafe(
                `ALTER TABLE ${table} DROP COLUMN IF EXISTS tenant_id;`
            );
        } catch (err) {
            console.error(`[startup] Cleanup error (drop tenant_id on ${table}):`, err.message);
        }
    }
    console.log("[startup] ✓ tenant_id columns removed from all tables OK");

    try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS tenants CASCADE;`);
        console.log("[startup] ✓ tenants table dropped OK");
    } catch (err) {
        console.error("[startup] Cleanup error (drop tenants):", err.message);
    }

    try {
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "TenantStatus";`);
        console.log("[startup] ✓ TenantStatus enum dropped OK");
    } catch (err) {
        console.error("[startup] Cleanup error (drop TenantStatus):", err.message);
    }

    await prisma.$disconnect();
}

applySchemaPatches()
    .then(() => {
        console.log("[startup] Schema patches complete.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("[startup] Fatal error:", err);
        process.exit(0); // still exit 0 so the server starts
    });
