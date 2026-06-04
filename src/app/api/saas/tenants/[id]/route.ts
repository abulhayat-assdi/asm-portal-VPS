export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSaasOwner } from '@/lib/auth';
import { invalidateTenantCache } from '@/lib/tenant';
import { registerSubdomainInCoolify } from '@/lib/coolify';
import { z } from 'zod';

const updateSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'DELETED']).optional(),
    plan: z.enum(['basic', 'pro', 'enterprise']).optional(),
    ownerName: z.string().optional(),
    ownerEmail: z.string().email().optional(),
    ownerPhone: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

/** GET /api/saas/tenants/[id] — tenant detail with stats */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user || !isSaasOwner(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const [students, teachers, users, batches] = await Promise.all([
        prisma.batchStudent.count({ where: { tenantId: id } }),
        prisma.teacher.count({ where: { tenantId: id } }),
        prisma.user.count({ where: { tenantId: id } }),
        prisma.batch.count({ where: { tenantId: id } }),
    ]);

    return NextResponse.json({ tenant, stats: { students, teachers, users, batches } });
}

/** PATCH /api/saas/tenants/[id] — update tenant (name, slug, status, plan, etc.) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user || !isSaasOwner(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // If slug is being changed, check uniqueness
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
        const slugConflict = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug } });
        if (slugConflict) {
            return NextResponse.json({ error: 'Subdomain already taken.' }, { status: 409 });
        }
        invalidateTenantCache(existing.slug);
    }

    const updated = await prisma.tenant.update({
        where: { id },
        data: parsed.data,
    });

    invalidateTenantCache(updated.slug);

    // Slug পরিবর্তন হলে নতুন subdomain Coolify-তে register করো
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
        registerSubdomainInCoolify(updated.slug).catch(() => {});
    }

    return NextResponse.json({ success: true, tenant: updated });
}

/** DELETE /api/saas/tenants/[id] — soft-delete (set status to DELETED) */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user || !isSaasOwner(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    await prisma.tenant.update({
        where: { id },
        data: { status: 'DELETED' },
    });

    invalidateTenantCache(tenant.slug);

    return NextResponse.json({ success: true });
}
