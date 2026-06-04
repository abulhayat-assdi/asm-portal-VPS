export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSuperAdmin } from '@/lib/auth';
import { getTenantBySlug, getTenantSlugFromHeaders } from '@/lib/tenant';
import { z } from 'zod';

const promoteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['super_admin', 'admin']),
});

/** GET /api/tenant/admins — list all admins and super_admins in this tenant */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantSlug = getTenantSlugFromHeaders(req.headers);
    const tenant = tenantSlug ? await getTenantBySlug(tenantSlug) : null;
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const admins = await prisma.user.findMany({
        where: {
            tenantId: tenant.id,
            role: { in: ['super_admin', 'admin'] },
            deletedAt: null,
        },
        select: {
            id: true, email: true, displayName: true, role: true,
            createdAt: true, lastLoginAt: true, profileImageUrl: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ admins });
}

/** POST /api/tenant/admins — promote a user to super_admin or admin (tenant super_admin only) */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });
    }

    const tenantSlug = getTenantSlugFromHeaders(req.headers);
    const tenant = tenantSlug ? await getTenantBySlug(tenantSlug) : null;
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await req.json();
    const parsed = promoteSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, role } = parsed.data;

    // Find user in this tenant
    const target = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), tenantId: tenant.id, deletedAt: null },
    });

    if (!target) {
        return NextResponse.json({ error: 'এই email-এর কোনো ব্যবহারকারী এই tenant-এ নেই।' }, { status: 404 });
    }

    if (target.id === user.id) {
        return NextResponse.json({ error: 'নিজেকে promote/demote করা যাবে না।' }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id: target.id },
        data: { role },
        select: { id: true, email: true, displayName: true, role: true },
    });

    return NextResponse.json({ success: true, user: updated });
}
