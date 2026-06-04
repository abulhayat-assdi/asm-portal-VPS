export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAllDefaultContent } from "@/lib/defaultCmsContent";

// GET /api/cms?pageId=home_page — public endpoint, no auth required
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
        return NextResponse.json({ error: "pageId is required" }, { status: 400 });
    }

    try {
        const record = await prisma.cmsContent.findUnique({ where: { key: pageId } });
        if (!record) {
            // Return empty so cmsService merges with defaults
            return NextResponse.json({});
        }
        return NextResponse.json(record.value);
    } catch {
        return NextResponse.json({});
    }
}
