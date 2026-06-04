export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSaasOwner } from '@/lib/auth';

/** GET /api/saas/tenants/[id]/users — tenant-এর admin/super_admin users list */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionUser(req);
    if (!user || !isSaasOwner(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const users = await prisma.user.findMany({
        where: { tenantId: id, deletedAt: null },
        select: {
            id: true, email: true, displayName: true,
            role: true, lastLoginAt: true, createdAt: true,
            profileImageUrl: true,
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ users });
}
