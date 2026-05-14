import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/leaves?teacherId=...&monthYear=... */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const monthYear = searchParams.get("monthYear");

    const where: any = {};
    if (teacherId) where.teacherId = teacherId;
    if (monthYear) where.monthYear = monthYear;

    const leaves = await prisma.leave.findMany({
        where,
        orderBy: { startDate: "desc" },
    });

    return NextResponse.json(leaves);
}

/** POST /api/leaves */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { teacherId, teacherName, startDate, endDate, days, type, reason, monthYear } = body;

        const leave = await prisma.leave.create({
            data: {
                teacherId,
                teacherName,
                startDate,
                endDate,
                days: Number(days) || 1,
                type: type || "Casual",
                reason: reason || null,
                monthYear,
            },
        });

        return NextResponse.json({ id: leave.id, ...leave }, { status: 201 });
    } catch (error) {
        console.error("[Leaves POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/leaves — update a leave record */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const leave = await prisma.leave.update({ where: { id }, data });
        return NextResponse.json(leave);
    } catch (error) {
        console.error("[Leaves PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/leaves?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.leave.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
