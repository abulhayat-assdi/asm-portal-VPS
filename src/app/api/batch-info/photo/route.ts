import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH /api/batch-info/photo
 * Update a student's photo URL and sync to their User.profileImageUrl.
 * Body: { batchName, roll, photo } — photo is null to clear.
 */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { batchName, roll, photo } = body as { batchName: string; roll: string; photo: string | null };

    if (!batchName || !roll) {
        return NextResponse.json({ error: "batchName and roll are required" }, { status: 400 });
    }

    try {
        await prisma.batchStudent.update({
            where: { batchName_roll: { batchName, roll } },
            data: { photo: photo || null },
        });

        // Sync photo to the student's User account so Navbar picks it up
        await prisma.user.updateMany({
            where: { studentBatchName: batchName, studentRoll: roll },
            data: { profileImageUrl: photo || null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[BatchInfo Photo PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
