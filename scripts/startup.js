/**
 * startup.js — runs before the Next.js server starts.
 * Applies any schema changes that aren't covered by migration files.
 * Safe to run multiple times (uses IF NOT EXISTS / idempotent SQL).
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Default tenant info for the original TASM institution
const DEFAULT_TENANT_SLUG = "tasm-skill";
const DEFAULT_TENANT_NAME = "TASM Skill Development Center";

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

    // ── Multi-tenant SaaS patches ───────────────────────────────

    try {
        // Create TenantStatus enum type
        await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'DELETED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        console.log("[startup] ✓ TenantStatus enum OK");
    } catch (err) {
        console.error("[startup] Schema patch error (TenantStatus enum):", err.message);
    }

    try {
        // Create tenants table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS tenants (
                id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
                slug TEXT NOT NULL,
                name TEXT NOT NULL,
                tagline TEXT,
                logo TEXT,
                favicon TEXT,
                primary_color TEXT NOT NULL DEFAULT '#1a56db',
                accent_color TEXT NOT NULL DEFAULT '#f3f4f6',
                status "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
                plan TEXT NOT NULL DEFAULT 'basic',
                owner_name TEXT NOT NULL DEFAULT '',
                owner_email TEXT NOT NULL DEFAULT '',
                owner_phone TEXT,
                settings JSONB NOT NULL DEFAULT '{}',
                trial_ends_at TIMESTAMP(3),
                created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT tenants_pkey PRIMARY KEY (id)
            );
        `);
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_key ON tenants(slug);
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS tenants_status_idx ON tenants(status);
        `);
        console.log("[startup] ✓ tenants table OK");
    } catch (err) {
        console.error("[startup] Schema patch error (tenants table):", err.message);
    }

    // Add tenant_id column to all tables (idempotent)
    const tablesNeedingTenantId = [
        "users",
        "teachers",
        "classes",
        "class_schedules",
        "batches",
        "batch_students",
        "notices",
        "student_notices",
        "homework_submissions",
        "homework_assignments",
        "feedback",
        "contact_messages",
        "chat_threads",
        "activity_logs",
        "resources",
        "module_folders",
        "module_resources",
        "posts",
        "exam_results",
        "routines",
        "policies",
        "cms_content",
        "success_stories",
        "video_testimonials",
        "daily_tracker_reports",
        "student_update_requests",
        "batch_routine_entries",
        "routine_configs",
        "student_exam_batch_records",
        "course_modules",
        "video_stories",
    ];

    for (const table of tablesNeedingTenantId) {
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS tenant_id TEXT;
            `);
            // Add index for fast tenant-scoped queries
            await prisma.$executeRawUnsafe(`
                CREATE INDEX IF NOT EXISTS ${table}_tenant_id_idx ON ${table}(tenant_id);
            `);
        } catch (err) {
            console.error(`[startup] Schema patch error (tenant_id on ${table}):`, err.message);
        }
    }
    console.log("[startup] ✓ tenant_id columns added to all tables OK");

    // ── Create default tenant and backfill existing data ────────

    try {
        // Check if default tenant exists
        const existingTenants = await prisma.$queryRawUnsafe(`
            SELECT id FROM tenants WHERE slug = $1 LIMIT 1;
        `, DEFAULT_TENANT_SLUG);

        let defaultTenantId;

        if (!existingTenants || existingTenants.length === 0) {
            // Create the default tenant for the original TASM institution
            const result = await prisma.$queryRawUnsafe(`
                INSERT INTO tenants (id, slug, name, owner_name, owner_email, status, plan, settings)
                VALUES (
                    gen_random_uuid()::TEXT,
                    $1,
                    $2,
                    'TASM Admin',
                    'admin@tasm-skill.asf.bd',
                    'ACTIVE',
                    'enterprise',
                    '{}'
                )
                RETURNING id;
            `, DEFAULT_TENANT_SLUG, DEFAULT_TENANT_NAME);
            defaultTenantId = result[0].id;
            console.log(`[startup] ✓ Default tenant created: ${DEFAULT_TENANT_SLUG} (id: ${defaultTenantId})`);
        } else {
            defaultTenantId = existingTenants[0].id;
            console.log(`[startup] ✓ Default tenant already exists: ${defaultTenantId}`);
        }

        // Backfill tenant_id for all records that don't have one
        for (const table of tablesNeedingTenantId) {
            try {
                await prisma.$executeRawUnsafe(`
                    UPDATE ${table} SET tenant_id = $1 WHERE tenant_id IS NULL;
                `, defaultTenantId);
            } catch (err) {
                console.error(`[startup] Backfill error (${table}):`, err.message);
            }
        }
        console.log("[startup] ✓ Existing data backfilled to default tenant OK");

    } catch (err) {
        console.error("[startup] Error creating default tenant:", err.message);
    } finally {
        await prisma.$disconnect();
    }
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
