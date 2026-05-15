import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { DEFAULT_SECTION_ORDER } from "@/lib/cv/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/cv — list current user's CV drafts */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const drafts = await prisma.cvDraft.findMany({
    where: { userId: user.id },
    include: { template: { select: { name: true, slug: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    drafts.map((d) => ({
      id: d.id,
      title: d.title,
      templateId: d.templateId,
      templateName: d.template.name,
      templateSlug: d.template.slug,
      downloadCount: d.downloadCount,
      isPublic: d.isPublic,
      shareSlug: d.shareSlug,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }))
  );
}

/** POST /api/cv — create a new CV draft */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { templateId, title } = body;

  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  const template = await prisma.cvTemplate.findUnique({ where: { id: templateId } });
  if (!template || !template.isActive) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const draft = await prisma.cvDraft.create({
    data: {
      userId: user.id,
      templateId,
      title: title || "My CV",
      skills: [],
      languages: [],
      hobbies: [],
      workExperience: [],
      training: [],
      education: [],
      references: [],
      sectionOrder: DEFAULT_SECTION_ORDER,
    },
  });

  return NextResponse.json({ id: draft.id }, { status: 201 });
}
