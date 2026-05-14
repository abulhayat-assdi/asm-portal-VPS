import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/mark-class-complete
 * Marks a class as COMPLETED in PostgreSQL.
 * If the class doesn't exist (e.g. it was a virtual sheet class), it creates it.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { classId, clsData } = body;

        if (!classId) {
            return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
        }

        let result;

        if (classId.startsWith('sheet_')) {
            // Create a new record for a virtual sheet class
            result = await prisma.class.create({
                data: {
                    teacherUid: clsData.teacherUid,
                    teacherName: clsData.teacherName,
                    date: clsData.date,
                    startTime: clsData.startTime || "",
                    endTime: clsData.endTime || "",
                    timeRange: clsData.timeRange || "",
                    batch: clsData.batch,
                    subject: clsData.subject,
                    status: "COMPLETED",
                    completedByUid: user.id,
                    completedAt: new Date(),
                }
            });
        } else {
            // Update existing class
            result = await prisma.class.update({
                where: { id: classId },
                data: {
                    status: "COMPLETED",
                    completedByUid: user.id,
                    completedAt: new Date(),
                }
            });
        }

        // Log Activity
        await prisma.activityLog.create({
            data: {
                actorUid: user.id,
                actorRole: "ADMIN",
                actionType: "CLASS_COMPLETED",
                targetType: "class",
                targetId: result.id,
                description: `Admin marked class '${result.subject}' for '${result.batch}' as completed`,
            }
        });

        return NextResponse.json({ success: true, class: result });
    } catch (error) {
        console.error("Failed to mark class as complete:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
