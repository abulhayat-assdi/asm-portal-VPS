export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSaasOwner } from '@/lib/auth';
import { invalidateTenantCache } from '@/lib/tenant';
import { z } from 'zod';

const schema = z.object({
    name:         z.string().min(2).max(100).optional(),
    tagline:      z.string().max(200).optional(),
    logo:         z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    accentColor:  z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

/** PATCH /api/saas/tenants/[id]/branding — saas-admin থেকে tenant branding আপডেট */
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

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.tenant.update({
        where: { id },
        data: parsed.data,
    });

    invalidateTenantCache(tenant.slug);

    return NextResponse.json({ success: true, tenant: updated });
}
