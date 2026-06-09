export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.$executeRaw`
            ALTER TABLE course_modules
            ADD COLUMN IF NOT EXISTS teacher_name  TEXT NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS teacher_email TEXT NOT NULL DEFAULT ''
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[add-teacher-fields] Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
    }
}
