import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { PORTAL_OWNER_EMAIL } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/teachers
 * Public API to fetch all teachers from PostgreSQL.
 * Uses raw SQL so image_object_position is included without requiring prisma generate.
 */
export async function GET() {
    try {
        // Ensure image_object_position column exists (idempotent patch)
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "image_object_position" TEXT DEFAULT 'center'
            `);
        } catch (dbErr) {
            console.warn("[Teachers GET] Warning adding image_object_position column:", dbErr);
        }

        const teachers = await prisma.$queryRaw<any[]>`
            SELECT
                id,
                teacher_id          AS "teacherId",
                name,
                designation,
                about,
                phone,
                email,
                login_email         AS "loginEmail",
                profile_image_url   AS "profileImageUrl",
                image_object_position AS "imageObjectPosition",
                is_admin            AS "isAdmin",
                "order",
                leave_tracking_enabled AS "leaveTrackingEnabled",
                created_at          AS "createdAt",
                updated_at          AS "updatedAt"
            FROM teachers
            ORDER BY "order" ASC
        `;

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

        // If only updating image_object_position, use raw SQL to avoid Prisma schema mismatch
        if (data.imageObjectPosition !== undefined && Object.keys(data).length === 1) {
            await prisma.$executeRaw`
                UPDATE teachers
                SET image_object_position = ${String(data.imageObjectPosition)}
                WHERE id = ${id}
            `;
            return NextResponse.json({ success: true });
        }

        // Standard Prisma update for all other fields
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
        if (data.imageObjectPosition !== undefined) updateData.imageObjectPosition = data.imageObjectPosition;

        if (Object.keys(updateData).length > 0) {
            await prisma.teacher.update({ where: { id }, data: updateData });
        }

        // Also update image_object_position via raw SQL if included alongside other fields
        if (data.imageObjectPosition !== undefined) {
            await prisma.$executeRaw`
                UPDATE teachers
                SET image_object_position = ${String(data.imageObjectPosition)}
                WHERE id = ${id}
            `;
        }

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
