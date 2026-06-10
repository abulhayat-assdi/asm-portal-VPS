export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

/**
 * POST /api/admin/resource-library/setup-db
 * Migrates module_folders and module_resources for the new teacher-based Resource Library.
 * Idempotent — safe to run multiple times.
 */
export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const steps: string[] = [];

        // ══════════════════════════════════════════════════════════════
        // module_folders
        // ══════════════════════════════════════════════════════════════

        // ── 1. Add new columns (IF NOT EXISTS) ─────────────────────────
        await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "teacher_uid" TEXT NOT NULL DEFAULT ''`;
        await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "teacher_name" TEXT NOT NULL DEFAULT ''`;
        await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT ''`;
        await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "visible_for_batches" JSONB NOT NULL DEFAULT '["all"]'`;
        await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false`;
        await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "parent_folder_id" TEXT`;
        steps.push("module_folders: new columns added OK");

        // ── 2. Make OLD required columns nullable / add defaults ────────
        // These columns (module_id, module_title, name) are NOT NULL in the old schema.
        // Prisma no longer knows about them, so new inserts won't provide values.
        // We must give them defaults so existing rows & new inserts both work.
        try {
            await prisma.$executeRaw`ALTER TABLE "module_folders" ALTER COLUMN "module_id" SET DEFAULT ''`;
            steps.push("module_folders: module_id default OK");
        } catch { steps.push("module_folders: module_id column not present (skipped)"); }

        try {
            await prisma.$executeRaw`ALTER TABLE "module_folders" ALTER COLUMN "module_title" SET DEFAULT ''`;
            steps.push("module_folders: module_title default OK");
        } catch { steps.push("module_folders: module_title column not present (skipped)"); }

        try {
            await prisma.$executeRaw`ALTER TABLE "module_folders" ALTER COLUMN "name" SET DEFAULT ''`;
            steps.push("module_folders: name default OK");
        } catch { steps.push("module_folders: name column not present (skipped)"); }

        try {
            await prisma.$executeRaw`ALTER TABLE "module_folders" ALTER COLUMN "created_by" DROP NOT NULL`;
            steps.push("module_folders: created_by nullable OK");
        } catch { steps.push("module_folders: created_by column not present (skipped)"); }

        // ── 3. Self-referencing FK for sub-folders ──────────────────────
        try {
            await prisma.$executeRaw`
                ALTER TABLE "module_folders"
                  ADD CONSTRAINT "module_folders_parent_folder_id_fkey"
                  FOREIGN KEY ("parent_folder_id") REFERENCES "module_folders"("id") ON DELETE CASCADE
            `;
            steps.push("module_folders: sub-folder FK created");
        } catch { steps.push("module_folders: sub-folder FK already exists (skipped)"); }

        // ── 4. Indexes ──────────────────────────────────────────────────
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "module_folders_teacher_uid_idx" ON "module_folders"("teacher_uid")`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "module_folders_parent_folder_id_idx" ON "module_folders"("parent_folder_id")`;
        steps.push("module_folders: indexes OK");

        // ══════════════════════════════════════════════════════════════
        // module_resources — new columns & defaults on old NOT NULL cols
        // ══════════════════════════════════════════════════════════════

        // New optional/nullable columns
        await prisma.$executeRaw`ALTER TABLE "module_resources" ADD COLUMN IF NOT EXISTS "folder_id" TEXT`;
        await prisma.$executeRaw`ALTER TABLE "module_resources" ADD COLUMN IF NOT EXISTS "resource_type" TEXT NOT NULL DEFAULT 'Other'`;
        await prisma.$executeRaw`ALTER TABLE "module_resources" ADD COLUMN IF NOT EXISTS "visible_for_batches" JSONB NOT NULL DEFAULT '["all"]'`;
        await prisma.$executeRaw`ALTER TABLE "module_resources" ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false`;
        steps.push("module_resources: new columns added OK");

        // FK from module_resources.folder_id → module_folders.id
        try {
            await prisma.$executeRaw`
                ALTER TABLE "module_resources"
                  ADD CONSTRAINT "module_resources_folder_id_fkey"
                  FOREIGN KEY ("folder_id") REFERENCES "module_folders"("id") ON DELETE SET NULL
            `;
            steps.push("module_resources: folder FK created");
        } catch { steps.push("module_resources: folder FK already exists (skipped)"); }

        // Set defaults on old NOT NULL columns
        try {
            await prisma.$executeRaw`
                ALTER TABLE "module_resources"
                  ALTER COLUMN "module_id"    SET DEFAULT '',
                  ALTER COLUMN "module_title" SET DEFAULT '',
                  ALTER COLUMN "teacher_name" SET DEFAULT '',
                  ALTER COLUMN "teacher_uid"  SET DEFAULT ''
            `;
            steps.push("module_resources: old column defaults OK");
        } catch (e) {
            steps.push("module_resources: old column defaults skipped: " + (e instanceof Error ? e.message : e));
        }

        // Indexes
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "module_resources_teacher_uid_idx" ON "module_resources"("teacher_uid")`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "module_resources_folder_id_idx" ON "module_resources"("folder_id")`;
        steps.push("module_resources: indexes OK");

        return NextResponse.json({ success: true, steps });
    } catch (error) {
        console.error("[resource-library/setup-db]", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
