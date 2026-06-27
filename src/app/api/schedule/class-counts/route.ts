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

    try {
        // Only show active batches
        const activeBatches = await prisma.batch.findMany({
            where: { status: "active" },
            select: { name: true },
        });
        const activeBatchNames = activeBatches.map(b => b.name);

        const formatted: Record<string, { subjectName: string; classCount: number }[]> = {};
        for (const name of activeBatchNames) {
            formatted[name] = [];
        }

        if (activeBatchNames.length === 0) return NextResponse.json({});

        const counts = await prisma.batchClassCount.findMany({
            where: { batchName: { in: activeBatchNames } },
        });

        for (const item of counts) {
            formatted[item.batchName].push({
                subjectName: item.subjectName,
                classCount: item.classCount,
            });
        }

        // Sort by classCount descending
        for (const batchName of Object.keys(formatted)) {
            formatted[batchName].sort((a, b) => b.classCount - a.classCount);
        }

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("[class-counts GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/schedule/class-counts
 * Supports manual update of a single batch, or bulk sync from Excel.
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actorRole = user.role === "teacher" ? "TEACHER" : "ADMIN";

    try {
        const body = await req.json();
        const { isBulk, batchName, subjects, data } = body;

        if (isBulk) {
            if (!Array.isArray(data)) {
                return NextResponse.json({ error: "data array required for bulk sync" }, { status: 400 });
            }

            // Sync/Upsert all rows
            for (const row of data) {
                if (!row.batchName || !row.subjectName) continue;
                await prisma.batchClassCount.upsert({
                    where: {
                        batchName_subjectName: {
                            batchName: row.batchName.trim(),
                            subjectName: row.subjectName.trim(),
                        }
                    },
                    update: {
                        classCount: Number(row.classCount) || 0,
                    },
                    create: {
                        batchName: row.batchName.trim(),
                        subjectName: row.subjectName.trim(),
                        classCount: Number(row.classCount) || 0,
                    }
                });
            }

            // Log activity
            await prisma.activityLog.create({
                data: {
                    actorUid: user.id,
                    actorRole: actorRole,
                    actionType: "CLASS_COUNTS_IMPORT",
                    targetType: "batch_class_counts",
                    targetId: "bulk",
                    description: `User imported class counts from Excel (${data.length} records)`,
                }
            });

            return NextResponse.json({ success: true, count: data.length });
        } else {
            if (!batchName || !Array.isArray(subjects)) {
                return NextResponse.json({ error: "batchName and subjects array required" }, { status: 400 });
            }

            // Clean existing subjects for this batch and replace with new set
            await prisma.batchClassCount.deleteMany({
                where: { batchName }
            });

            if (subjects.length > 0) {
                await prisma.batchClassCount.createMany({
                    data: subjects.map((s: any) => ({
                        batchName,
                        subjectName: s.subjectName.trim(),
                        classCount: Number(s.classCount) || 0,
                    }))
                });
            }

            // Log activity
            await prisma.activityLog.create({
                data: {
                    actorUid: user.id,
                    actorRole: actorRole,
                    actionType: "CLASS_COUNTS_UPDATE",
                    targetType: "batch_class_counts",
                    targetId: batchName,
                    description: `User updated class counts for batch ${batchName} (${subjects.length} subjects)`,
                }
            });

            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error("[class-counts POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

