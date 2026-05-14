import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/batch-info/bulk?batches=A,B,C — fetch students from multiple batches */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchesParam = searchParams.get("batches");

    if (!batchesParam) {
        return NextResponse.json({ error: "batches parameter required" }, { status: 400 });
    }

    const batchNames = batchesParam.split(",").map(b => b.trim()).filter(Boolean);

    const students = await prisma.batchStudent.findMany({
        where: { batchName: { in: batchNames } },
        orderBy: [{ batchName: "asc" }, { roll: "asc" }],
    });

    return NextResponse.json(students);
}
