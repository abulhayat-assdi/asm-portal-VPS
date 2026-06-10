import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/resources/folders
 * ?teacherUid=xxx            → all root folders for a teacher (no parentFolderId)
 * ?parentFolderId=xxx        → sub-folders of a folder
 * ?folderId=xxx              → single folder (same as parentFolderId query alias)
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

    const folders = await prisma.moduleFolder.findMany({
        where,
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(folders);
}

/** POST /api/resources/folders */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { teacherUid, teacherName, parentFolderId, title, description, visibleForBatches, isHidden } = body;

        const folder = await prisma.moduleFolder.create({
            data: {
                teacherUid:        teacherUid        || user.id,
                teacherName:       teacherName       || user.displayName || "",
                parentFolderId:    parentFolderId    || null,
                title:             title             || "",
                description:       description       || null,
                visibleForBatches: visibleForBatches || ["all"],
                isHidden:          isHidden          || false,
            },
        });

        return NextResponse.json(folder, { status: 201 });
    } catch (error) {
        console.error("[Folders POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

    // Cascade deletes sub-folders and resources via DB FK
    await prisma.moduleFolder.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
