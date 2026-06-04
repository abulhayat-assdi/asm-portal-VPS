export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSaasOwner } from '@/lib/auth';
import { invalidateTenantCache } from '@/lib/tenant';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createTenantSchema = z.object({
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    name: z.string().min(2).max(100),
    ownerName: z.string().min(2).max(100),
    ownerEmail: z.string().email(),
    ownerPassword: z.string().min(8),
    ownerPhone: z.string().optional(),
    plan: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1a56db'),
});

/** GET /api/saas/tenants — list all tenants (SaaS owner only) */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isSaasOwner(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
    });

    // Attach basic stats to each tenant
    const tenantsWithStats = await Promise.all(
        tenants.map(async (t) => {
            const [students, teachers, users] = await Promise.all([
                prisma.batchStudent.count({ where: { tenantId: t.id } }),
                prisma.teacher.count({ where: { tenantId: t.id } }),
                prisma.user.count({ where: { tenantId: t.id } }),
            ]);
            return { ...t, stats: { students, teachers, users } };
        })
    );

    return NextResponse.json({ tenants: tenantsWithStats });
}

/** POST /api/saas/tenants — create a new tenant (SaaS owner only) */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isSaasOwner(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { slug, name, ownerName, ownerEmail, ownerPassword, ownerPhone, plan, primaryColor } = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
        return NextResponse.json({ error: 'Subdomain already taken. Please choose another.' }, { status: 409 });
    }

    // Check if owner email is already a user in any tenant
    const existingUser = await prisma.user.findFirst({ where: { email: ownerEmail.toLowerCase() } });
    if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    // Create tenant + super_admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
            data: {
                slug,
                name,
                ownerName,
                ownerEmail: ownerEmail.toLowerCase(),
                ownerPhone,
                plan,
                primaryColor,
                status: 'ACTIVE',
            },
        });

        const passwordHash = await bcrypt.hash(ownerPassword, 12);
        const adminUser = await tx.user.create({
            data: {
                tenantId: tenant.id,
                email: ownerEmail.toLowerCase(),
                passwordHash,
                displayName: ownerName,
                role: 'super_admin',
                permissions: [],
            },
        });

        return { tenant, adminUser };
    });

    return NextResponse.json({
        success: true,
        tenant: result.tenant,
        adminUserId: result.adminUser.id,
        portalUrl: `https://${slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tasm-skill.asf.bd'}`,
    }, { status: 201 });
}
