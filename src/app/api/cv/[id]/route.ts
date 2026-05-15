import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getDraftOrFail(id: string, userId: string, userIsAdmin: boolean) {
  const draft = await prisma.cvDraft.findUnique({
    where: { id },
    include: { template: { select: { name: true, slug: true } } },
  });
  if (!draft) return null;
  if (draft.userId !== userId && !userIsAdmin) return null;
  return draft;
}

/** GET /api/cv/[id] — get one draft (owner or admin) */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await getDraftOrFail(id, user.id, isAdmin(user));
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(draft);
}

/** PATCH /api/cv/[id] — full update (used on explicit save) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await getDraftOrFail(id, user.id, isAdmin(user));
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    title, templateId,
    fullName, profilePhoto, careerObjective,
    phone, email, address,
    dateOfBirth, bloodGroup, religion, maritalStatus, nationality,
    skills, languages, hobbies, workExperience, training, education, references,
    declaration, signature, sectionOrder,
  } = body;

  const updated = await prisma.cvDraft.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(templateId !== undefined && { templateId }),
      ...(fullName !== undefined && { fullName }),
      ...(profilePhoto !== undefined && { profilePhoto }),
      ...(careerObjective !== undefined && { careerObjective }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(bloodGroup !== undefined && { bloodGroup }),
      ...(religion !== undefined && { religion }),
      ...(maritalStatus !== undefined && { maritalStatus }),
      ...(nationality !== undefined && { nationality }),
      ...(skills !== undefined && { skills }),
      ...(languages !== undefined && { languages }),
      ...(hobbies !== undefined && { hobbies }),
      ...(workExperience !== undefined && { workExperience }),
      ...(training !== undefined && { training }),
      ...(education !== undefined && { education }),
      ...(references !== undefined && { references }),
      ...(declaration !== undefined && { declaration }),
      ...(signature !== undefined && { signature }),
      ...(sectionOrder !== undefined && { sectionOrder }),
    },
  });

  return NextResponse.json({ updatedAt: updated.updatedAt.toISOString() });
}

/** DELETE /api/cv/[id] */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await getDraftOrFail(id, user.id, isAdmin(user));
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.cvDraft.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
