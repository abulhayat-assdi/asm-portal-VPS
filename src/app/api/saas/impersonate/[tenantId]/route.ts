export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSaasOwner } from '@/lib/auth';
import { createImpersonationToken } from '@/lib/impersonation';

/**
 * POST /api/saas/impersonate/[tenantId]
 * একটা one-time token তৈরি করে এবং portal URL সহ return করে।
 * Client নতুন tab-এ /api/auth/impersonate?t=[token] খুলবে।
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const caller = await getSessionUser(req);
    if (!caller || !isSaasOwner(caller)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tenantId } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // সেই tenant-এর super_admin খোঁজো
    const adminUser = await prisma.user.findFirst({
        where: { tenantId, role: 'super_admin', deletedAt: null },
        orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
        return NextResponse.json({ error: 'এই tenant-এর কোনো super_admin নেই।' }, { status: 404 });
    }

    const token = createImpersonationToken(adminUser.id, tenant.slug);
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tasm-skill.asf.bd';
    const portalBaseUrl = `https://${tenant.slug}.${baseDomain}`;
    const impersonateUrl = `/api/auth/impersonate?t=${token}&redirect=${encodeURIComponent(portalBaseUrl + '/dashboard')}`;

    return NextResponse.json({ impersonateUrl, tenantName: tenant.name });
}
