import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/resources */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resources = await prisma.resource.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(resources);
}

/** POST /api/resources */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, description, fileType, fileName, fileUrl, storagePath, fileSize, uploadedBy } = body;

        const resource = await prisma.resource.create({
            data: {
                title,
                description: description || null,
                fileType: fileType || "",
                fileName: fileName || "",
                fileUrl: fileUrl || "",
                storagePath: storagePath || "",
                fileSize: fileSize || null,
                uploadedBy: uploadedBy || user.id,
            },
        });

        return NextResponse.json(resource, { status: 201 });
    } catch (error) {
        console.error("[Resources POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/resources */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const resource = await prisma.resource.update({ where: { id }, data });
        return NextResponse.json(resource);
    } catch (error) {
        console.error("[Resources PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/resources?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
