/**
 * startup.js — runs before the Next.js server starts.
 * Applies any schema changes that aren't covered by migration files.
 * Safe to run multiple times (uses IF NOT EXISTS / idempotent SQL).
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applySchemaPatches() {
    console.log("[startup] Applying schema patches...");

    try {
        // Add permissions column to users table (added for access management system)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::JSONB;
        `);
        console.log("[startup] ✓ users.permissions column OK");
    } catch (err) {
        console.error("[startup] Schema patch error (permissions):", err.message);
    }

    try {
        // Add photo column to batch_students table (Google Drive photo URL for student profiles)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE batch_students ADD COLUMN IF NOT EXISTS photo TEXT;
        `);
        console.log("[startup] ✓ batch_students.photo column OK");
    } catch (err) {
        console.error("[startup] Schema patch error (photo):", err.message);
    }

    try {
        // Create routine_configs table for per-batch routine display settings
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
