import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/homework/assignments?teacherUid=...&batchName=... */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const teacherUid = searchParams.get("teacherUid");
    const batchName = searchParams.get("batchName");

    const where: any = {};
    if (teacherUid) where.teacherUid = teacherUid;
    if (batchName) where.batchName = batchName;

    const assignments = await prisma.homeworkAssignment.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assignments);
}

/** POST /api/homework/assignments */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { teacherUid, teacherName, title, deadlineDate, batchName } = body;

        const assignment = await prisma.homeworkAssignment.create({
            data: {
                teacherUid: teacherUid || user.id,
                teacherName: teacherName || user.displayName,
                title,
                deadlineDate,
                batchName,
            },
        });

        return NextResponse.json({ id: assignment.id, ...assignment }, { status: 201 });
    } catch (error) {
        console.error("[Assignments POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/homework/assignments */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const assignment = await prisma.homeworkAssignment.update({ where: { id }, data });
        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[Assignments PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/homework/assignments?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.homeworkAssignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
