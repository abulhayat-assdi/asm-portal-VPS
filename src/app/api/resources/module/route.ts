import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/resources/module?moduleId=...&teacherUid=...&batchName=... */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");
    const teacherUid = searchParams.get("teacherUid");
    const folderId = searchParams.get("folderId");

    const where: any = { isHidden: false };
    if (moduleId) where.moduleId = moduleId;
    if (teacherUid) where.teacherUid = teacherUid;
    if (folderId) where.folderId = folderId;

    if (isTeacherOrAdmin(user)) {
        delete where.isHidden;
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
                moduleId,
                moduleTitle,
                teacherName: teacherName || user.displayName,
                teacherUid: teacherUid || user.id,
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

        return NextResponse.json({ id: resource.id, ...resource }, { status: 201 });
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
