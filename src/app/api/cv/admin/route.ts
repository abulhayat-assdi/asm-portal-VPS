import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/cv/admin — admin: list ALL CV drafts with user info */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const templateId = searchParams.get("templateId") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (templateId) where.templateId = templateId;

  const drafts = await prisma.cvDraft.findMany({
    where,
    include: {
      template: { select: { name: true } },
      user: { select: { displayName: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.cvDraft.count({ where });

  const filtered = search
    ? drafts.filter(
        (d) =>
          d.user.displayName.toLowerCase().includes(search.toLowerCase()) ||
          d.user.email.toLowerCase().includes(search.toLowerCase()) ||
          d.title.toLowerCase().includes(search.toLowerCase())
      )
    : drafts;

  return NextResponse.json({
    drafts: filtered.map((d) => ({
      id: d.id,
      title: d.title,
      userId: d.userId,
      userName: d.user.displayName,
      userEmail: d.user.email,
      templateName: d.template.name,
      downloadCount: d.downloadCount,
      isPublic: d.isPublic,
      shareSlug: d.shareSlug,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
