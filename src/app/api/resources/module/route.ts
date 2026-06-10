import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/resources/module
 * ?teacherUid=xxx            → all files for a teacher
 * ?teacherUid=xxx&root=true  → root-level files (no folder)
 * ?folderId=xxx              → files inside a specific folder
 * ?all=true                  → all files (admin)
 */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const teacherUid = searchParams.get("teacherUid");
    const folderId   = searchParams.get("folderId");
    const root       = searchParams.get("root") === "true";
    const all        = searchParams.get("all") === "true";

    const where: Record<string, unknown> = {};

    if (!isTeacherOrAdmin(user)) {
        where.isHidden = false;
    }

    if (all) {
        // no extra filter
    } else if (folderId) {
        where.folderId = folderId;
    } else if (teacherUid) {
        where.teacherUid = teacherUid;
        if (root) where.folderId = null;
    }

    const resources = await prisma.moduleResource.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(resources);
}

/** POST /api/resources/module */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            moduleId, moduleTitle, teacherName, teacherUid, folderId,
            title, description, fileType, fileName, fileUrl, storagePath,
            fileSize, resourceType, visibleForBatches, isHidden,
        } = body;

        const resource = await prisma.moduleResource.create({
            data: {
                moduleId:    moduleId    || "",
                moduleTitle: moduleTitle || "",
                teacherName: teacherName || user.displayName || "",
                teacherUid:  teacherUid  || user.id,
                folderId: folderId || null,
                title,
                description: description || null,
                fileType: fileType || "",
                fileName: fileName || "",
                fileUrl: fileUrl || "",
                storagePath: storagePath || "",
                fileSize: fileSize || null,
                resourceType: resourceType || "Other",
                visibleForBatches: visibleForBatches || ["all"],
                isHidden: isHidden || false,
            },
        });

        return NextResponse.json(resource, { status: 201 });
    } catch (error) {
        console.error("[ModuleResource POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/resources/module */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const resource = await prisma.moduleResource.update({ where: { id }, data });
        return NextResponse.json(resource);
    } catch (error) {
        console.error("[ModuleResource PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/resources/module?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.moduleResource.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
