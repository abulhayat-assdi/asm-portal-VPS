import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/cv/[id]/download — increment download counter */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const draft = await prisma.cvDraft.findUnique({ where: { id }, select: { userId: true } });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (draft.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.cvDraft.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
    select: { downloadCount: true },
  });

  return NextResponse.json({ downloadCount: updated.downloadCount });
}
