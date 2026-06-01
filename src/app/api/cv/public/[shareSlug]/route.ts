export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ shareSlug: string }> }) {
    const { shareSlug } = await params;

    const draft = await prisma.cvDraft.findFirst({
        where: { shareSlug, isPublic: true },
        include: { template: { select: { id: true, name: true, slug: true, config: true } } },
    });

    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Strip sensitive fields before returning
    const { userId: _uid, shareSlug: _slug, ...publicData } = draft as Record<string, unknown>;
    void _uid; void _slug;

    return NextResponse.json(publicData);
}
