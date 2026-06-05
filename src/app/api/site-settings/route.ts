export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantFeatures } from "@/lib/features";

// GET /api/site-settings — sidebar-এর জন্য: logo, siteName, feature flags
export async function GET() {
    try {
        const cmsRecord = await prisma.cmsContent.findUnique({ where: { key: "site_settings" } });
        const cms = cmsRecord?.value as Record<string, unknown> | null;

        const logoUrl = (cms?.logoUrl as string) || null;
        const siteName = (cms?.siteName as string) || null;
        const features = getTenantFeatures(null);

        return NextResponse.json({ logoUrl, siteName, features });
    } catch {
        return NextResponse.json({ logoUrl: null, siteName: null, features: {} });
    }
}
