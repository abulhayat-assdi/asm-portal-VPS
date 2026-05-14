import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/batch-info/import
 * Bulk import students into a batch.
 * Body: { batchName: string, students: StudentRow[] }
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { batchName, students } = body;

        if (!batchName || !Array.isArray(students)) {
            return NextResponse.json({ error: "batchName and students array required" }, { status: 400 });
        }

        // Ensure the batch exists
        let batch = await prisma.batch.findFirst({ where: { name: batchName } });
        if (!batch) {
            batch = await prisma.batch.create({ data: { name: batchName, status: "active" } });
        }

        let created = 0;
        let skipped = 0;

        for (const s of students) {
            if (!s.roll || !s.name) { skipped++; continue; }

            const existing = await prisma.batchStudent.findUnique({
                where: { batchName_roll: { batchName, roll: s.roll } },
            });

            if (existing) { skipped++; continue; }

            await prisma.batchStudent.create({
                data: {
                    batchId: batch.id,
                    batchName,
                    roll: s.roll,
                    name: s.name,
                    phone: s.phone || "",
                    address: s.address || "",
                    dob: s.dob || null,
                    educationalDegree: s.educationalDegree || null,
                    category: s.category || null,
                    bloodGroup: s.bloodGroup || null,
                    courseStatus: s.courseStatus || "Running",
                    batchType: s.batchType || "Running",
                    isPublic: s.isPublic ?? true,
                },
            });
            created++;
        }

        return NextResponse.json({ success: true, created, skipped });
    } catch (error) {
        console.error("[BatchInfo Import]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
