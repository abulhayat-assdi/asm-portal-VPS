import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/routines?batchName=... */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batchName = searchParams.get("batchName");

    const where: any = {};
    if (batchName) where.batchName = batchName;

    const routines = await prisma.routine.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(routines);
}

/** POST /api/routines */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { batchName, fileUrl, storagePath, fileName, uploadedBy } = body;

        const routine = await prisma.routine.create({
            data: {
                batchName,
                fileUrl: fileUrl || "",
                storagePath: storagePath || "",
                fileName: fileName || "",
                uploadedBy: uploadedBy || user.id,
            },
        });

        return NextResponse.json({ id: routine.id, ...routine }, { status: 201 });
    } catch (error) {
        console.error("[Routines POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/routines */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const routine = await prisma.routine.update({ where: { id }, data });
        return NextResponse.json(routine);
    } catch (error) {
        console.error("[Routines PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/routines?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.routine.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
