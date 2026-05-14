import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/results/batch?batchName=...
 * Returns all exam records for a batch.
 */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batchName = searchParams.get("batchName");
    if (!batchName) return NextResponse.json({ error: "batchName required" }, { status: 400 });

    const records = await prisma.studentExamBatchRecord.findMany({
        where: { batchName },
        orderBy: { roll: "asc" },
    });

    return NextResponse.json(records.map(r => ({
        id: r.id,
        batchName: r.batchName,
        roll: r.roll,
        name: r.name,
        ...(r.data as object),
    })));
}

/**
 * POST /api/results/batch — upsert all results for a batch
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { batchName, results } = body;

        if (!batchName || !Array.isArray(results)) {
            return NextResponse.json({ error: "batchName and results array required" }, { status: 400 });
        }

        await Promise.all(
            results.map((r: any) =>
                prisma.studentExamBatchRecord.upsert({
                    where: { batchName_roll: { batchName, roll: r.roll } },
                    update: {
                        name: r.name || "",
                        data: {
                            customColumns: r.customColumns,
                            examRecords: r.examRecords,
                            marks: r.marks,
                            remarks: r.remarks,
                        },
                    },
                    create: {
                        batchName,
                        roll: r.roll,
                        name: r.name || "",
                        data: {
                            customColumns: r.customColumns,
                            examRecords: r.examRecords,
                            marks: r.marks,
                            remarks: r.remarks,
                        },
                    },
                })
            )
        );

        return NextResponse.json({ success: true, count: results.length });
    } catch (error) {
        console.error("[Results Batch POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
