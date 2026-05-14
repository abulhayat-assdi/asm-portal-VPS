import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/schedule/batches — returns all active batches */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const batches = await prisma.batch.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(batches);
}
