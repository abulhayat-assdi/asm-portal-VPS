import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/batch-stats — aggregated stats per batch */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const batches = await prisma.batch.findMany({ orderBy: { name: "asc" } });

    const stats = await Promise.all(
        batches.map(async (batch) => {
            const [total, running, completed, expelled] = await Promise.all([
                prisma.batchStudent.count({ where: { batchName: batch.name } }),
                prisma.batchStudent.count({ where: { batchName: batch.name, courseStatus: "Running" } }),
                prisma.batchStudent.count({ where: { batchName: batch.name, courseStatus: "Completed" } }),
                prisma.batchStudent.count({ where: { batchName: batch.name, courseStatus: "Expelled" } }),
            ]);

            return {
                id: batch.id,
                name: batch.name,
                status: batch.status,
                totalStudents: total,
                runningStudents: running,
                completedStudents: completed,
                expelledStudents: expelled,
            };
        })
    );

    return NextResponse.json(stats);
}
