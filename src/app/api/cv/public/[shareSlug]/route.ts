import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/cv/public/[shareSlug] — no auth required, serves public CV data */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ shareSlug: string }> }) {
  const { shareSlug } = await params;

  const draft = await prisma.cvDraft.findUnique({
    where: { shareSlug },
    include: { template: { select: { name: true, slug: true } } },
  });

  if (!draft || !draft.isPublic) {
    return NextResponse.json({ error: "CV not found or not public" }, { status: 404 });
  }

  // Strip private/internal fields before sending
  const { userId: _uid, shareSlug: _slug, ...publicData } = draft;
  return NextResponse.json({
    ...publicData,
    templateName: draft.template.name,
    templateSlug: draft.template.slug,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  });
}
