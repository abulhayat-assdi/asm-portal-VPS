import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH /api/cv/[id]/auto-save
 * Lightweight endpoint called on every debounced keystroke.
 * Accepts partial body — only provided keys are updated.
 * Does NOT create a version snapshot (snapshots are created on explicit user action).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.cvDraft.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Strip undefined/null keys, only persist what was sent
  const allowedKeys = [
    "title", "templateId",
    "fullName", "profilePhoto", "careerObjective",
    "phone", "email", "address",
    "dateOfBirth", "bloodGroup", "religion", "maritalStatus", "nationality",
    "skills", "languages", "hobbies", "workExperience", "training",
    "education", "references", "declaration", "signature", "sectionOrder",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ skipped: true });
  }

  const updated = await prisma.cvDraft.update({ where: { id }, data });
  return NextResponse.json({ savedAt: updated.updatedAt.toISOString() });
}
