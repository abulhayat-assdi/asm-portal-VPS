import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/stats
 * Returns high-level stats for the admin dashboard.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const [
            totalUsers,
            totalNotices,
            totalResources,
            totalFeedback,
            pendingFeedback,
            pendingClasses
        ] = await Promise.all([
            prisma.user.count(),
            prisma.notice.count(),
            prisma.resource.count(),
            prisma.feedback.count(),
            prisma.feedback.count({ where: { status: "PENDING" } }),
            prisma.class.count({ where: { status: "PENDING" } })
        ]);

        return NextResponse.json({
            totalUsers,
            totalNotices,
            totalResources,
            totalFeedback,
            pendingFeedback,
            pendingClasses
        });
    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
