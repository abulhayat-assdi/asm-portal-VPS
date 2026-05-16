import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/cv/admin/templates — list all templates (admin) or active only (users) */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = isAdmin(user) ? {} : { isActive: true };
  const templates = await prisma.cvTemplate.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      thumbnail: t.thumbnail,
      description: t.description,
      isActive: t.isActive,
      config: t.config,
      createdAt: t.createdAt.toISOString(),
    }))
  );
}

/** POST /api/cv/admin/templates — create template (admin only) */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, slug, thumbnail, description, config } = await req.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const template = await prisma.cvTemplate.create({
    data: { name, slug, thumbnail, description, ...(config !== undefined && { config }) },
  });

  return NextResponse.json(template, { status: 201 });
}

/** PATCH /api/cv/admin/templates — update template (admin only) */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, name, slug, thumbnail, description, isActive, config } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const template = await prisma.cvTemplate.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(config !== undefined && { config }),
    },
  });

  return NextResponse.json(template);
}

/** DELETE /api/cv/admin/templates?id=... — delete template (admin only) */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const draftCount = await prisma.cvDraft.count({ where: { templateId: id } });
  if (draftCount > 0) {
    // Soft-disable instead of hard delete to preserve existing CVs
    await prisma.cvTemplate.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ deactivated: true, draftCount });
  }

  await prisma.cvTemplate.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
