import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/leaves/clean-duplicates
 * Removes duplicate WeeklyHoliday entries for a teacher in a given month.
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { teacherId, monthYear } = body;

        if (!teacherId || !monthYear) {
            return NextResponse.json({ error: "teacherId and monthYear required" }, { status: 400 });
        }

        const leaves = await prisma.leave.findMany({
            where: { teacherId, monthYear, type: "WeeklyHoliday" },
            orderBy: { createdAt: "asc" },
        });

        const seen = new Set<string>();
        const toDelete: string[] = [];

        for (const leave of leaves) {
            const key = `${leave.startDate}`;
            if (seen.has(key)) {
                toDelete.push(leave.id);
            } else {
                seen.add(key);
            }
        }

        if (toDelete.length > 0) {
            await prisma.leave.deleteMany({ where: { id: { in: toDelete } } });
        }

        return NextResponse.json({ deleted: toDelete.length });
    } catch (error) {
        console.error("[Leaves CleanDuplicates]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
