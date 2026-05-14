import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/schedule
 * Fetch schedules for a teacher or all schedules.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const teacherId = searchParams.get("teacherId");
        const all = searchParams.get("all") === "true";

        const where: any = {};
        if (teacherId && teacherId !== "ALL") {
            where.teacherId = teacherId;
        }

        // If not 'all', filter for current week or similar logic could go here
        // For now, let's just return all based on teacherId

        const schedules = await prisma.classSchedule.findMany({
            where,
            orderBy: { date: "asc" }
        });

        return NextResponse.json(schedules);
    } catch (error) {
        console.error("Failed to fetch schedules:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/schedule
 * Bulk add or single add schedules.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const schedulesData = body.schedules || (Array.isArray(body) ? body : [body]);

        if (!Array.isArray(schedulesData) || schedulesData.length === 0) {
            return NextResponse.json({ error: "No schedules provided" }, { status: 400 });
        }

        // Filter and map valid schedules
        const validSchedules = schedulesData
            .filter((s: any) => s.teacherId && s.teacherName)
            .map((s: any) => ({
                teacherId: s.teacherId.trim(),
                teacherName: s.teacherName.trim(),
                date: s.date?.trim() || "",
                day: s.day?.trim() || "",
                batch: s.batch?.trim() || "",
                subject: s.subject?.trim() || "",
                time: s.time?.trim() || "",
                status: s.status || "Scheduled",
            }));

        if (validSchedules.length === 0) {
            return NextResponse.json({ error: "No valid schedules with teacher info" }, { status: 400 });
        }

        // Prisma transaction for bulk create
        const result = await prisma.classSchedule.createMany({
            data: validSchedules,
            skipDuplicates: true,
        });

        return NextResponse.json({
            success: true,
            message: `Added ${result.count} schedules successfully`,
            count: result.count
        });
    } catch (error) {
        console.error("Failed to add schedules:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
