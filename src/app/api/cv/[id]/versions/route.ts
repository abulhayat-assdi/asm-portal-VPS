import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { MAX_CV_VERSIONS } from "@/lib/cv/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/cv/[id]/versions — list version history */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.cvDraft.findUnique({ where: { id }, select: { userId: true } });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (draft.userId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const versions = await prisma.cvVersion.findMany({
    where: { draftId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true },
  });

  return NextResponse.json(versions.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })));
}

/** POST /api/cv/[id]/versions — create a snapshot */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.cvDraft.findUnique({ where: { id } });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (draft.userId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const label: string | undefined = body.label;

  // Create snapshot
  const version = await prisma.cvVersion.create({
    data: {
      draftId: id,
      label: label ?? null,
      snapshot: draft as object,
    },
  });

  // Prune oldest versions if over limit
  const allVersions = await prisma.cvVersion.findMany({
    where: { draftId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (allVersions.length > MAX_CV_VERSIONS) {
    const toDelete = allVersions.slice(MAX_CV_VERSIONS).map((v) => v.id);
    await prisma.cvVersion.deleteMany({ where: { id: { in: toDelete } } });
  }

  return NextResponse.json({ id: version.id, createdAt: version.createdAt.toISOString() }, { status: 201 });
}

/** PATCH /api/cv/[id]/versions — restore a snapshot */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.cvDraft.findUnique({ where: { id }, select: { userId: true } });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (draft.userId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { versionId } = await req.json();
  const version = await prisma.cvVersion.findUnique({ where: { id: versionId } });
  if (!version || version.draftId !== id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const snap = version.snapshot as Record<string, unknown>;

  // Restore all data fields from snapshot, preserve id/userId/shareSlug/downloadCount
  await prisma.cvDraft.update({
    where: { id },
    data: {
      title: (snap.title as string) ?? "My CV",
      templateId: snap.templateId as string,
      fullName: (snap.fullName as string) ?? null,
      profilePhoto: (snap.profilePhoto as string) ?? null,
      careerObjective: (snap.careerObjective as string) ?? null,
      phone: (snap.phone as string) ?? null,
      email: (snap.email as string) ?? null,
      address: (snap.address as string) ?? null,
      dateOfBirth: (snap.dateOfBirth as string) ?? null,
      bloodGroup: (snap.bloodGroup as string) ?? null,
      religion: (snap.religion as string) ?? null,
      maritalStatus: (snap.maritalStatus as string) ?? null,
      nationality: (snap.nationality as string) ?? null,
      skills: snap.skills ?? [],
      languages: snap.languages ?? [],
      hobbies: snap.hobbies ?? [],
      workExperience: snap.workExperience ?? [],
      training: snap.training ?? [],
      education: snap.education ?? [],
      references: snap.references ?? [],
      declaration: (snap.declaration as string) ?? null,
      signature: (snap.signature as string) ?? null,
      sectionOrder: snap.sectionOrder ?? [],
    },
  });

  return NextResponse.json({ restored: true });
}
