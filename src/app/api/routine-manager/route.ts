import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/routine-manager?batch=... */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batch = searchParams.get("batch");

    const where: any = {};
    if (batch) where.batch = batch;

    const entries = await prisma.batchRoutineEntry.findMany({
        where,
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(entries);
}

/**
 * POST /api/routine-manager
 * Full replace: delete all existing entries for batch, then insert new ones.
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { batchName, routines } = body;

        if (!batchName || !Array.isArray(routines)) {
            return NextResponse.json({ error: "batchName and routines array required" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.batchRoutineEntry.deleteMany({ where: { batch: batchName } });
            if (routines.length > 0) {
                await tx.batchRoutineEntry.createMany({
                    data: routines.map((r: any) => ({
                        batch: batchName,
                        dayOfWeek: r.dayOfWeek || "",
                        startTime: r.startTime || "",
                        endTime: r.endTime || "",
                        subject: r.subject || "",
                        teacherName: r.teacherName || "",
                        room: r.room || "",
                    })),
                });
            }
        });

        return NextResponse.json({ success: true, count: routines.length });
    } catch (error) {
        console.error("[RoutineManager POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
