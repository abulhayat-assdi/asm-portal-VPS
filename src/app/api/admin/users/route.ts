export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

/** GET /api/admin/users — list all users (admin only) */
export async function GET(req: NextRequest) {
    const caller = await getSessionUser(req);
    if (!caller || !isAdmin(caller)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                teacherId: true,
                studentBatchName: true,
                studentRoll: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[Admin Users GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
