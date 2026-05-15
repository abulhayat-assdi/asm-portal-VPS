import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/schedule/class-counts
 * Returns class counts grouped by batch → subject.
 * Only includes batches with status="active" in the batches table.
 * Format: Record<batchName, { subjectName: string; classCount: number }[]>
 */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only show active batches
    const activeBatches = await prisma.batch.findMany({
        where: { status: "active" },
        select: { name: true },
    });
    const activeBatchNames = activeBatches.map(b => b.name);

    if (activeBatchNames.length === 0) return NextResponse.json({});

    const classes = await prisma.class.findMany({
        where: { batch: { in: activeBatchNames } },
        select: { batch: true, subject: true },
        orderBy: { batch: "asc" },
    });

    const result: Record<string, Record<string, number>> = {};

    for (const cls of classes) {
        if (!result[cls.batch]) result[cls.batch] = {};
        result[cls.batch][cls.subject] = (result[cls.batch][cls.subject] || 0) + 1;
    }

    const formatted: Record<string, { subjectName: string; classCount: number }[]> = {};
    for (const [batchName, subjects] of Object.entries(result)) {
        formatted[batchName] = Object.entries(subjects)
            .map(([subjectName, classCount]) => ({ subjectName, classCount }))
            .sort((a, b) => b.classCount - a.classCount);
    }

    return NextResponse.json(formatted);
}
