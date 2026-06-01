export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isSuperAdmin, isAdmin } from "@/lib/auth";
import { PORTAL_OWNER_EMAIL, getEffectivePermissions, ALL_PERMISSION_KEYS } from "@/lib/permissions";

/**
 * GET /api/admin/access-management
 * Returns all non-student users with their permissions.
 * Only super_admin can access.
 */
export async function GET(req: NextRequest) {
    const caller = await getSessionUser(req);
    if (!caller || !isAdmin(caller)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        where: {
            role: { notIn: ["student"] },
            deletedAt: null,
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            permissions: true,
            createdAt: true,
        },
        orderBy: [{ role: "asc" }, { displayName: "asc" }],
    });

    const result = users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        isPortalOwner: u.email === PORTAL_OWNER_EMAIL,
        permissions: getEffectivePermissions(u.role, u.permissions as string[] | null),
    }));

    return NextResponse.json(result);
}

/**
 * PUT /api/admin/access-management
 * Body: { userId: string, permissions: string[] }
 * Updates permissions for a user.
 * Only super_admin can call this.
 */
export async function PUT(req: NextRequest) {
    const caller = await getSessionUser(req);
    if (!caller || !isSuperAdmin(caller)) {
        return NextResponse.json({ error: "Forbidden: Only super_admin can manage permissions." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, permissions } = body;

    if (!userId || !Array.isArray(permissions)) {
        return NextResponse.json({ error: "userId and permissions array are required." }, { status: 400 });
    }

    // Validate permission keys
    const invalid = permissions.filter((p: string) => !ALL_PERMISSION_KEYS.includes(p as any));
    if (invalid.length > 0) {
        return NextResponse.json({ error: `Invalid permission keys: ${invalid.join(", ")}` }, { status: 400 });
    }

    // Find target user
    const target = await prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!target) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Portal owner permissions cannot be changed
    if (target.email === PORTAL_OWNER_EMAIL) {
        return NextResponse.json({ error: "The portal owner's permissions cannot be changed." }, { status: 403 });
    }

    // Students cannot be given admin permissions
    if (target.role === "student") {
        return NextResponse.json({ error: "Student permissions cannot be managed here." }, { status: 400 });
    }

    // access_management permission can only be granted to admins/super_admins, not teachers
    const filteredPermissions = target.role === "teacher"
        ? permissions.filter((p: string) => p !== "access_management")
        : permissions;

    await prisma.user.update({
        where: { id: userId },
        data: { permissions: filteredPermissions },
    });

    return NextResponse.json({ success: true, permissions: filteredPermissions });
}
