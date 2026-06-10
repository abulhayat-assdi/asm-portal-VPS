import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// GET /api/admin/teachers/add-image-position
// Adds image_object_position column to teachers table (idempotent)
export async function GET(req: NextRequest) {
    const caller = await getSessionUser(req);
    if (!caller || !isAdmin(caller)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$executeRawUnsafe(
        `ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "image_object_position" TEXT DEFAULT 'center'`
    );

    return NextResponse.json({ success: true, message: "Column added (or already existed)." });
}
