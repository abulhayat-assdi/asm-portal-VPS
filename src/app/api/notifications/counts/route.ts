import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/notifications/counts
 * Returns notification counts for the sidebar based on last visited timestamps.
 * Query params: lastVisited_<path>=<timestamp_ms>
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const role = user.role;

        const counts: Record<string, number> = {};

        // Helper to get timestamp from query
        const getTs = (path: string) => {
            const val = searchParams.get(`lastVisited_${path}`);
            return val ? new Date(parseInt(val, 10)) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        };

        // 1. Homework Submissions (Teacher/Admin)
        if (role === "admin" || role === "teacher") {
            const ts = getTs("/dashboard/homework");
            const where: any = {
                submittedAt: { gt: ts }
            };
            
            // Teachers only see their own homework
            if (role === "teacher") {
                where.teacherName = user.displayName;
            }

            counts["/dashboard/homework"] = await prisma.homeworkSubmission.count({ where });
        }

        // 2. Admin Manage Homework
        if (role === "admin") {
            const ts = getTs("/dashboard/admin/manage-homework");
            counts["/dashboard/admin/manage-homework"] = await prisma.homeworkSubmission.count({
                where: { submittedAt: { gt: ts } }
            });
        }

        // 3. Contact Messages (Admin only)
        if (role === "admin") {
            counts["/dashboard/admin/contact-messages"] = await prisma.contactMessage.count({
                where: { status: "unread" }
            });
        }

        // 4. Feedback (Admin only)
        if (role === "admin") {
            const ts = getTs("/dashboard/feedback");
            counts["/dashboard/feedback"] = await prisma.feedback.count({
                where: { createdAt: { gt: ts } }
            });
        }

        // 5. Daily Tracker (Admin only)
        if (role === "admin") {
            const ts = getTs("/dashboard/tracker");
            counts["/dashboard/tracker"] = await prisma.dailyTrackerReport.count({
                where: { createdAt: { gt: ts } }
            });
        }

        return NextResponse.json({ counts });
    } catch (error) {
        console.error("Failed to fetch notification counts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
