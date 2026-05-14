export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin, isSuperAdmin } from "@/lib/auth";
import { z } from "zod";

const updateTeacherSchema = z.object({
    teacherDbId: z.string().min(1, "Teacher DB ID is required"),  // Teacher table UUID
    newLoginEmail: z.string().email().optional(),
    isAdmin: z.boolean().optional(),
    teacherId: z.string().optional(),
});

/**
 * POST /api/admin/update-teacher
 * Updates a teacher's login email and/or admin role.
 * Only super_admin can change the admin flag.
 */
export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = updateTeacherSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.message }, { status: 400 });
        }

        const { teacherDbId, newLoginEmail, isAdmin: grantAdmin, teacherId } = parsed.data;

        // Only super_admin can change the admin flag
        if (grantAdmin !== undefined && !isSuperAdmin(caller)) {
            return NextResponse.json(
                { error: "Forbidden: Only the portal owner (super_admin) can grant or revoke admin access." },
                { status: 403 }
            );
        }

        // Find teacher record
        const teacher = await prisma.teacher.findUnique({ where: { id: teacherDbId } });
        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        // Find corresponding user account
        const user = await prisma.user.findFirst({
            where: { email: teacher.loginEmail || teacher.email },
        });

        await prisma.$transaction(async (tx: any) => {
            // Update teacher record
            await tx.teacher.update({
                where: { id: teacherDbId },
                data: {
                    ...(newLoginEmail ? { loginEmail: newLoginEmail.toLowerCase().trim() } : {}),
                    ...(grantAdmin !== undefined ? { isAdmin: grantAdmin } : {}),
                    ...(teacherId ? { teacherId } : {}),
                },
            });

            // Update user account if it exists
            if (user) {
                const newRole = grantAdmin !== undefined
                    ? (grantAdmin ? 'admin' : 'teacher')
                    : undefined;

                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        ...(newLoginEmail ? { email: newLoginEmail.toLowerCase().trim() } : {}),
                        ...(newRole ? { role: newRole as any } : {}),
                        ...(teacherId ? { teacherId } : {}),
                    },
                });
            }
        });

        return NextResponse.json({ success: true, message: "Teacher updated successfully." });
    } catch (error: unknown) {
        console.error("[Update Teacher API] Error:", error);
        const message = error instanceof Error ? error.message : "Failed to update teacher.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
