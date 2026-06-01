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
        console.error("[startup] Schema patch error:", err.message);
        // Non-fatal — app can still start even if this fails
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
