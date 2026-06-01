import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { PORTAL_OWNER_EMAIL } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/teachers
 * Public API to fetch all teachers from PostgreSQL.
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

/**
 * PATCH /api/teachers
 * Update teacher display fields (name, designation, about, phone, email, image, etc.)
 */
export async function PATCH(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: "Teacher id is required" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.teacherId !== undefined) updateData.teacherId = data.teacherId;
        if (data.designation !== undefined) updateData.designation = data.designation;
        if (data.about !== undefined) updateData.about = data.about;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.loginEmail !== undefined) updateData.loginEmail = data.loginEmail;
        if (data.profileImageUrl !== undefined) updateData.profileImageUrl = data.profileImageUrl;
        if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin;
        if (data.order !== undefined) updateData.order = data.order;
        if (data.leaveTrackingEnabled !== undefined) updateData.leaveTrackingEnabled = data.leaveTrackingEnabled;

        await prisma.teacher.update({ where: { id }, data: updateData });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Teachers PATCH] Error:", error);
        const message = error instanceof Error ? error.message : "Failed to update teacher.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE /api/teachers?id=<teacher_db_uuid>
 * Delete a teacher and their user account.
 */
export async function DELETE(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Teacher id is required" }, { status: 400 });
        }

        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        // Portal owner cannot be deleted by anyone
        const teacherEmail = teacher.loginEmail || teacher.email;
        if (teacherEmail === PORTAL_OWNER_EMAIL) {
            return NextResponse.json({ error: "The portal owner's account cannot be deleted." }, { status: 403 });
        }

        await prisma.$transaction(async (tx: any) => {
            if (teacherEmail) {
                await tx.user.deleteMany({ where: { email: teacherEmail } });
            }
            await tx.teacher.delete({ where: { id } });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Teachers DELETE] Error:", error);
        const message = error instanceof Error ? error.message : "Failed to delete teacher.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
