import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function generateShareSlug(): string {
  return randomBytes(8).toString("base64url");
}

/** POST /api/cv/[id]/share — enable public sharing (generate slug) */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.cvDraft.findUnique({
    where: { id },
    select: { userId: true, shareSlug: true, isPublic: true },
  });
  if (!draft || draft.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reuse existing slug or generate new one
  let slug = draft.shareSlug;
  if (!slug) {
    // Ensure uniqueness
    let unique = false;
    while (!unique) {
      slug = generateShareSlug();
      const existing = await prisma.cvDraft.findUnique({ where: { shareSlug: slug } });
      if (!existing) unique = true;
    }
  }

  await prisma.cvDraft.update({
    where: { id },
    data: { shareSlug: slug, isPublic: true },
  });

  return NextResponse.json({ shareSlug: slug, isPublic: true });
}

/** DELETE /api/cv/[id]/share — disable public sharing */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.cvDraft.findUnique({ where: { id }, select: { userId: true } });
  if (!draft || draft.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.cvDraft.update({ where: { id }, data: { isPublic: false } });
  return NextResponse.json({ isPublic: false });
}
