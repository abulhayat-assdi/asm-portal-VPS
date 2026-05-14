import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/dashboard/notices
 * Returns all staff/general notices.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notices = await prisma.notice.findMany({
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(notices);
    } catch (error) {
        console.error("Failed to fetch notices:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/dashboard/notices
 * Create a new notice (Admin only)
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, date, priority } = body;

        const notice = await prisma.notice.create({
            data: {
                title,
                description,
                date: date || new Date().toISOString().split('T')[0],
                priority: priority || "normal",
                createdBy: user.id,
                createdByName: user.displayName || "Admin",
            }
        });

        return NextResponse.json(notice);
    } catch (error) {
        console.error("Failed to create notice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
