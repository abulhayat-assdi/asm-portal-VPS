export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSaasOwner } from '@/lib/auth';
import { invalidateTenantCache } from '@/lib/tenant';
import { ALL_FEATURES } from '@/lib/features';
import { Prisma } from '@prisma/client';

/** PATCH /api/saas/tenants/[id]/features — feature flags আপডেট */
export async function PATCH(
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

    const body = await req.json() as Record<string, boolean>;

    // শুধু valid feature keys accept করো
    const validKeys = new Set(ALL_FEATURES.map(f => f.key));
    const sanitized: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(body)) {
        if (validKeys.has(key) && typeof val === 'boolean') {
            sanitized[key] = val;
        }
    }

    const currentSettings = (tenant.settings as Record<string, unknown>) ?? {};
    const updatedSettings = {
        ...currentSettings,
        features: { ...(currentSettings.features as Record<string, boolean> ?? {}), ...sanitized },
    };

    const updated = await prisma.tenant.update({
        where: { id },
        data: { settings: updatedSettings as Prisma.InputJsonValue },
    });

    invalidateTenantCache(tenant.slug);

    return NextResponse.json({ success: true, settings: updated.settings });
}
