export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantBySlug, getTenantSlugFromHeaders } from "@/lib/tenant";
import { getSessionUser } from "@/lib/auth";
import { getTenantFeatures } from "@/lib/features";

// GET /api/site-settings — sidebar-এর জন্য: logo, siteName, feature flags
export async function GET(req: NextRequest) {
    try {
        // 1. Tenant খোঁজো (slug → user tenantId → null)
        const slug = getTenantSlugFromHeaders(req.headers);
        let tenant = slug ? await getTenantBySlug(slug) : null;

        if (!tenant) {
            const user = await getSessionUser(req);
            if (user?.tenantId) {
                tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
            }
        }

        // 2. CMS-এ site_settings (logo/name override) চেক করো
        const cmsKey = tenant ? `site_settings_${tenant.id}` : "site_settings";
        const [cmsRecord, fallbackCms] = await Promise.all([
            prisma.cmsContent.findUnique({ where: { key: cmsKey } }),
            prisma.cmsContent.findUnique({ where: { key: "site_settings" } }),
        ]);

        const cms = (cmsRecord ?? fallbackCms)?.value as Record<string, unknown> | null;

        const logoUrl = (cms?.logoUrl as string) || tenant?.logo || null;
        const siteName = (cms?.siteName as string) || tenant?.name || null;
        const features = getTenantFeatures(tenant?.settings ?? null);

        return NextResponse.json({ logoUrl, siteName, features });
    } catch {
        return NextResponse.json({ logoUrl: null, siteName: null, features: {} });
    }
}
