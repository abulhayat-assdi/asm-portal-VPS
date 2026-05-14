import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PATCH /api/schedule/complete — mark a class schedule entry as completed */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status } = body;

        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const schedule = await prisma.classSchedule.update({
            where: { id },
            data: { status: status || "Completed" },
        });

        return NextResponse.json(schedule);
    } catch (error) {
        console.error("[Schedule Complete]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
