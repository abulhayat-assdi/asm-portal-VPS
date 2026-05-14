import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/pending-classes
 * Returns all classes with PENDING status for admin review.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const pendingClasses = await prisma.class.findMany({
            where: { status: "PENDING" },
            orderBy: { date: "asc" }
        });

        return NextResponse.json(pendingClasses);
    } catch (error) {
        console.error("Failed to fetch pending classes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
