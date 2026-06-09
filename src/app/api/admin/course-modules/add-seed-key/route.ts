export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// Adds seed_key column and backfills it from current slug values.
// seed_key stores the original data-file key so renaming slug in admin never
// causes Sync to re-import an already-seeded module.
export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 1. Add column if missing
        await prisma.$executeRaw`
            ALTER TABLE course_modules
            ADD COLUMN IF NOT EXISTS seed_key TEXT NOT NULL DEFAULT ''
        `;

        // 2. Backfill: for any row where seed_key is still blank, copy from slug
        await prisma.$executeRaw`
            UPDATE course_modules
            SET seed_key = slug
            WHERE seed_key = '' OR seed_key IS NULL
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[add-seed-key] Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
    }
}
