import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Idempotent schema migration.
 * Adds new columns (IF NOT EXISTS) and gives old NOT NULL columns a DEFAULT ''
 * so Prisma inserts — which no longer include those old columns — don't fail.
 */
async function ensureSchema() {
    await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "teacher_uid" TEXT NOT NULL DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "teacher_name" TEXT NOT NULL DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "visible_for_batches" JSONB NOT NULL DEFAULT '["all"]'`;
    await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "module_folders" ADD COLUMN IF NOT EXISTS "parent_folder_id" TEXT`;
    try { await prisma.$executeRaw`ALTER TABLE "module_folders" ALTER COLUMN "module_id" SET DEFAULT ''`; } catch { /* column may not exist */ }
    try { await prisma.$executeRaw`ALTER TABLE "module_folders" ALTER COLUMN "module_title" SET DEFAULT ''`; } catch { /* column may not exist */ }
    try { await prisma.$executeRaw`ALTER TABLE "module_folders" ALTER COLUMN "name" SET DEFAULT ''`; } catch { /* column may not exist */ }
    try { await prisma.$executeRaw`ALTER TABLE "module_folders" ALTER COLUMN "created_by" DROP NOT NULL`; } catch { /* column may not exist */ }
    try {
        await prisma.$executeRaw`
            ALTER TABLE "module_folders"
              ADD CONSTRAINT "module_folders_parent_folder_id_fkey"
              FOREIGN KEY ("parent_folder_id") REFERENCES "module_folders"("id") ON DELETE CASCADE
        `;
    } catch { /* constraint may already exist */ }
}

/**
 * GET /api/resources/folders
 * ?teacherUid=xxx            → all root folders for a teacher (no parentFolderId)
 * ?parentFolderId=xxx        → sub-folders of a folder
 * ?all=true                  → all folders (admin use)
 */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const teacherUid      = searchParams.get("teacherUid");
    const parentFolderId  = searchParams.get("parentFolderId");
    const all             = searchParams.get("all") === "true";

    const where: Record<string, unknown> = {};

    if (all) {
        // no extra filter
    } else if (parentFolderId) {
        where.parentFolderId = parentFolderId;
    } else if (teacherUid) {
        where.teacherUid = teacherUid;
        where.parentFolderId = null; // root folders only
    }

    try {
        const folders = await prisma.moduleFolder.findMany({
            where,
            orderBy: { createdAt: "asc" },
        });
        return NextResponse.json(folders);
    } catch (error) {
        // New columns may not exist yet — auto-migrate and retry once
        console.warn("[Folders GET] schema not ready, migrating...", error);
        try {
            await ensureSchema();
            const folders = await prisma.moduleFolder.findMany({
                where,
                orderBy: { createdAt: "asc" },
            });
            return NextResponse.json(folders);
        } catch (retryError) {
            console.error("[Folders GET] after migration:", retryError);
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    }
}

/** POST /api/resources/folders */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { teacherUid, teacherName, parentFolderId, title, description, visibleForBatches, isHidden } = body;

    const folderData = {
        teacherUid:        teacherUid        || user.id,
        teacherName:       teacherName       || user.displayName || "",
        parentFolderId:    parentFolderId    || null,
        title:             title             || "",
        description:       description       || null,
        visibleForBatches: visibleForBatches || ["all"],
        isHidden:          isHidden          || false,
    };

    try {
        const folder = await prisma.moduleFolder.create({ data: folderData });
        return NextResponse.json(folder, { status: 201 });
    } catch (firstError) {
        // Old NOT NULL columns (module_id, module_title, name) have no DEFAULT yet — migrate and retry
        console.warn("[Folders POST] first attempt failed, running schema migration...", firstError);
        try {
            await ensureSchema();
            const folder = await prisma.moduleFolder.create({ data: folderData });
            return NextResponse.json(folder, { status: 201 });
        } catch (retryError) {
            console.error("[Folders POST] after migration:", retryError);
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    }
}

/** PATCH /api/resources/folders */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const folder = await prisma.moduleFolder.update({ where: { id }, data });
        return NextResponse.json(folder);
    } catch (error) {
        console.error("[Folders PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/resources/folders?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    try {
        await prisma.moduleFolder.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Folders DELETE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
