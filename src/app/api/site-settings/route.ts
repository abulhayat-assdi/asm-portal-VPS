export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/site-settings — public endpoint, returns logo URL and site name
export async function GET() {
    try {
        const record = await prisma.cmsContent.findUnique({
            where: { key: "site_settings" },
        });

        if (!record) {
            return NextResponse.json({ logoUrl: null, siteName: null });
        }

        const value = record.value as Record<string, unknown>;
        return NextResponse.json({
            logoUrl: (value.logoUrl as string) || null,
            siteName: (value.siteName as string) || null,
        });
    } catch {
        return NextResponse.json({ logoUrl: null, siteName: null });
    }
}
