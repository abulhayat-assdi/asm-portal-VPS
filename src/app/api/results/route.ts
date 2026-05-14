import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/results?batchName=...&roll=...&all=true
 * Uses StudentExamBatchRecord for complex multi-exam data.
 */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batchName = searchParams.get("batchName");
    const roll = searchParams.get("roll");
    const all = searchParams.get("all") === "true";

    if (all && isTeacherOrAdmin(user)) {
        const records = await prisma.studentExamBatchRecord.findMany({ orderBy: { batchName: "asc" } });
        return NextResponse.json(records.map(r => ({ id: r.id, batchName: r.batchName, roll: r.roll, name: r.name, ...(r.data as object) })));
    }

    if (batchName && roll) {
        const record = await prisma.studentExamBatchRecord.findUnique({
            where: { batchName_roll: { batchName, roll } },
        });
        if (!record) return NextResponse.json(null);
        return NextResponse.json({ id: record.id, batchName: record.batchName, roll: record.roll, name: record.name, ...(record.data as object) });
    }

    if (batchName) {
        const records = await prisma.studentExamBatchRecord.findMany({ where: { batchName } });
        return NextResponse.json(records.map(r => ({ id: r.id, batchName: r.batchName, roll: r.roll, name: r.name, ...(r.data as object) })));
    }

    return NextResponse.json([]);
}

/**
 * POST /api/results — save or update a single result
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { batchName, roll, name, customColumns, examRecords, marks, remarks } = body;

        if (!batchName || !roll) {
            return NextResponse.json({ error: "batchName and roll required" }, { status: 400 });
        }

        const data = { customColumns, examRecords, marks, remarks };

        const record = await prisma.studentExamBatchRecord.upsert({
            where: { batchName_roll: { batchName, roll } },
            update: { data, name: name || "" },
            create: { batchName, roll, name: name || "", data },
        });

        return NextResponse.json({ id: record.id, success: true });
    } catch (error) {
        console.error("[Results POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
