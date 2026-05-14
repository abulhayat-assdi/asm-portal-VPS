import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/teachers
 * Public API to fetch all teachers from PostgreSQL.
 * Safe to call from server components.
 */
export async function GET() {
    try {
        const teachers = await prisma.teacher.findMany({
            orderBy: { order: "asc" },
        });

        return NextResponse.json(teachers);
    } catch (error) {
        console.error("[Teachers API] Error:", error);
        return NextResponse.json([], { status: 500 });
    }
}
