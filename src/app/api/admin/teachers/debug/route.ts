import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// GET /api/admin/teachers/debug
// Super-admin only — returns every teacher row exactly as stored in the DB
export async function GET(req: NextRequest) {
    const caller = await getSessionUser(req);
    if (!caller || !isAdmin(caller)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teachers = await prisma.teacher.findMany({
        orderBy: { order: "asc" },
    });

    return NextResponse.json(teachers);
}
