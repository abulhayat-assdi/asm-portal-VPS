import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";
import { BatchType, CourseStatus, CurrentlyDoing, StudentCategory } from "@prisma/client";

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

/**
 * POST /api/batch-info/bulk
 * Upsert all students for a batch and delete removed ones.
 * Body: { batchName, students, batchType, completedAt? }
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { batchName, students, batchType, completedAt } = body;

        if (!batchName || !Array.isArray(students)) {
            return NextResponse.json({ error: "batchName and students are required" }, { status: 400 });
        }

        // Find or create the Batch record
        let batch = await prisma.batch.findUnique({ where: { name: batchName } });
        if (!batch) {
            batch = await prisma.batch.create({
                data: {
                    name: batchName,
                    status: batchType === "Completed" ? "archived" : "active",
                },
            });
        } else if (batchType === "Completed") {
            batch = await prisma.batch.update({
                where: { id: batch.id },
                data: { status: "archived" },
            });
        }

        const mapCurrentlyDoing = (value: string | undefined): CurrentlyDoing | null => {
            if (!value) return null;
            const map: Record<string, CurrentlyDoing> = {
                "Job": CurrentlyDoing.Job,
                "Business": CurrentlyDoing.Business,
                "Studying Further": CurrentlyDoing.StudyingFurther,
                "StudyingFurther": CurrentlyDoing.StudyingFurther,
                "Nothing": CurrentlyDoing.Nothing,
            };
            return map[value] ?? null;
        };

        const mapCategory = (value: string | undefined): StudentCategory | null => {
            if (value === "Alim") return StudentCategory.Alim;
            if (value === "General") return StudentCategory.General;
            return null;
        };

        const mapCourseStatus = (value: string | undefined, bType: string): CourseStatus => {
            if (value === "Completed") return CourseStatus.Completed;
            if (value === "Incomplete") return CourseStatus.Incomplete;
            if (value === "Expelled") return CourseStatus.Expelled;
            if (value === "Running") return CourseStatus.Running;
            return bType === "Completed" ? CourseStatus.Completed : CourseStatus.Running;
        };

        const completedAtDate = completedAt ? new Date(completedAt) : batchType === "Completed" ? new Date() : null;

        await Promise.all(
            students.map(async (s: Record<string, unknown>) => {
                const roll = String(s.roll);
                const data = {
                    batchId: batch!.id,
                    batchName,
                    name: String(s.name),
                    phone: String(s.phone || ""),
                    address: String(s.address || ""),
                    dob: s.dob ? String(s.dob) : null,
                    educationalDegree: s.educationalDegree ? String(s.educationalDegree) : null,
                    category: mapCategory(s.category as string),
                    bloodGroup: s.bloodGroup ? String(s.bloodGroup) : null,
                    totalPaidTk: s.totalPaidTk ? String(s.totalPaidTk) : null,
                    courseStatus: mapCourseStatus(s.courseStatus as string, batchType),
                    currentlyDoing: mapCurrentlyDoing(s.currentlyDoing as string),
                    companyName: String(s.companyName || ""),
                    businessName: String(s.businessName || ""),
                    salary: Number(s.salary) || 0,
                    batchType: batchType === "Completed" ? BatchType.Completed : BatchType.Running,
                    isPublic: (s.isPublic as boolean) ?? true,
                    completedAt: completedAtDate,
                };

                await prisma.batchStudent.upsert({
                    where: { batchName_roll: { batchName, roll } },
                    create: { ...data, roll },
                    update: data,
                });
            })
        );

        // Remove students from this batch that were not in the submitted list
        const providedRolls = students.map((s: Record<string, unknown>) => String(s.roll));
        await prisma.batchStudent.deleteMany({
            where: {
                batchName,
                roll: { notIn: providedRolls },
            },
        });

        return NextResponse.json({ success: true, count: students.length });
    } catch (error) {
        console.error("[batch-info/bulk POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
