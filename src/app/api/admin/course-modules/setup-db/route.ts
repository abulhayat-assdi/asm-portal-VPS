export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// Creates the course_modules table if it doesn't exist — bypasses prisma migrate
export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check if table already exists
        const check = await prisma.$queryRaw<{ exists: boolean }[]>`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'course_modules'
            ) as exists
        `;

        if (check[0]?.exists) {
            return NextResponse.json({ message: "Table already exists — ready to use!", alreadyExists: true });
        }

        // Create the table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "course_modules" (
                "id"           TEXT NOT NULL,
                "slug"         TEXT NOT NULL,
                "title"        TEXT NOT NULL,
                "description"  TEXT NOT NULL DEFAULT '',
                "pdf_link"     TEXT NOT NULL DEFAULT '',
                "bullets"      JSONB NOT NULL DEFAULT '[]',
                "curriculum"   JSONB NOT NULL DEFAULT '[]',
                "is_published" BOOLEAN NOT NULL DEFAULT true,
                "order"        INTEGER NOT NULL DEFAULT 0,
                "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
            )
        `;

        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "course_modules_slug_key" ON "course_modules"("slug")
        `;

        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "course_modules_order_idx" ON "course_modules"("order")
        `;

        // Mark migration as applied in _prisma_migrations so future deploys don't conflict
        try {
            await prisma.$executeRaw`
                INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
                VALUES (
                    gen_random_uuid()::text,
                    '0000000000000000000000000000000000000000000000000000000000000000',
                    NOW(),
                    '20260602000000_add_course_modules',
                    NULL, NULL, NOW(), 1
                )
                ON CONFLICT DO NOTHING
            `;
        } catch {
            // _prisma_migrations might not exist — not critical
        }

        return NextResponse.json({ message: "Table created successfully! Now click 'Import Existing Modules'.", created: true });
    } catch (error) {
        console.error("[setup-db] Error:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
