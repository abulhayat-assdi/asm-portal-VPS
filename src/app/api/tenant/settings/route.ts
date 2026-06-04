export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSuperAdmin } from '@/lib/auth';
import { getTenantBySlug, getTenantSlugFromHeaders, invalidateTenantCache } from '@/lib/tenant';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const updateSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    tagline: z.string().max(200).optional(),
    logo: z.string().optional(),
    favicon: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
});

/** GET /api/tenant/settings — get current tenant settings */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantSlug = getTenantSlugFromHeaders(req.headers);
    if (!tenantSlug) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    return NextResponse.json({ tenant });
}

/** PATCH /api/tenant/settings — update tenant branding (super_admin of this tenant only) */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });
    }

    const tenantSlug = getTenantSlugFromHeaders(req.headers);
    if (!tenantSlug) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Make sure the user belongs to this tenant
    if (user.tenantId && user.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { settings, ...rest } = parsed.data;
    const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
            ...rest,
            ...(settings !== undefined && { settings: settings as unknown as Prisma.InputJsonValue }),
        },
    });

    invalidateTenantCache(tenantSlug);

    return NextResponse.json({ success: true, tenant: updated });
}
