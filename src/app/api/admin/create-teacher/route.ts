export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { AUTH_ROLES } from "@/lib/constants";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createTeacherSchema = z.object({
    teacherId: z.string().min(1, "Teacher ID is required"),
    loginEmail: z.string().email("Invalid login email"),
    displayEmail: z.string().email("Invalid display email").optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(1, "Name is required"),
    phone: z.string().optional(),
    designation: z.string().optional(),
    about: z.string().optional(),
    isAdmin: z.boolean().optional(),
    order: z.number().optional(),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Auth check — only admins/super_admins can create teachers
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = createTeacherSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.message }, { status: 400 });
        }

        const { teacherId, loginEmail, displayEmail, password, name, phone, designation, about, isAdmin: grantAdmin, order } = parsed.data;

        // 2. Only super_admin can grant admin role
        if (grantAdmin && caller.role !== "super_admin") {
            return NextResponse.json(
                { error: "Forbidden: Only the portal owner (super_admin) can grant admin access." },
                { status: 403 }
            );
        }

        const normalizedLoginEmail = loginEmail.toLowerCase().trim();

        // 3. Check for existing user
        const existing = await prisma.user.findUnique({ where: { email: normalizedLoginEmail } });
        if (existing) {
            return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
        }

        // 4. Hash password
        const passwordHash = await bcrypt.hash(password, 12);
        const role = grantAdmin ? AUTH_ROLES.ADMIN : AUTH_ROLES.TEACHER;

        // 5. Create user and teacher records in a transaction
        const result = await prisma.$transaction(async (tx: any) => {
            const user = await tx.user.create({
                data: {
                    email: normalizedLoginEmail,
                    passwordHash,
                    displayName: name,
                    role,
                    teacherId,
                },
            });

            const teacher = await tx.teacher.create({
                data: {
                    teacherId,
                    name,
                    designation: designation || "",
                    about: about || "",
                    phone: phone || "",
                    email: displayEmail || normalizedLoginEmail,
                    loginEmail: normalizedLoginEmail,
                    isAdmin: grantAdmin || false,
                    order: order || 0,
                },
            });

            return { user, teacher };
        });

        return NextResponse.json(
            { success: true, uid: result.user.id, message: "Teacher created successfully." },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("[Create Teacher API] Error:", error);
        const message = error instanceof Error ? error.message : "Failed to create teacher account.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
