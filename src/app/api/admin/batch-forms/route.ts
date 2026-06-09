export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeSlug(batchName: string): string {
  const base = slugify(batchName) || "batch";
  const rand = randomUUID().replace(/-/g, "").slice(0, 8);
  return `${base}-${rand}`;
}

type RawBatchForm = {
  id: string;
  batch_name: string;
  form_slug: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

type RawBatch = { name: string };

type PendingCount = { batch_name: string; cnt: bigint };

// GET /api/admin/batch-forms
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all batches
    const batches = await prisma.$queryRaw<RawBatch[]>`
      SELECT name FROM "batches" ORDER BY created_at DESC
    `;

    // Auto-create BatchForm for any batch that doesn't have one
    for (const batch of batches) {
      const existing = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "batch_forms" WHERE batch_name = ${batch.name} LIMIT 1
      `;
      if (existing.length === 0) {
        const id = randomUUID();
        const slug = makeSlug(batch.name);
        await prisma.$executeRaw`
          INSERT INTO "batch_forms" (id, batch_name, form_slug, is_active, created_at, updated_at)
          VALUES (${id}, ${batch.name}, ${slug}, true, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // Fetch all forms
    const forms = await prisma.$queryRaw<RawBatchForm[]>`
      SELECT * FROM "batch_forms" ORDER BY created_at DESC
    `;

    // Pending submission counts
    const pendingCounts = await prisma.$queryRaw<PendingCount[]>`
      SELECT batch_name, COUNT(id) as cnt
      FROM "student_form_submissions"
      WHERE status = 'pending'
      GROUP BY batch_name
    `;
    const pendingMap = new Map(pendingCounts.map((p) => [p.batch_name, Number(p.cnt)]));

    const result = forms.map((f) => ({
      id: f.id,
      batchName: f.batch_name,
      formSlug: f.form_slug,
      isActive: f.is_active,
      createdAt: f.created_at,
      pendingCount: pendingMap.get(f.batch_name) ?? 0,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/batch-forms]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/batch-forms — toggle isActive
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { batchName, isActive } = await req.json();
    await prisma.$executeRaw`
      UPDATE "batch_forms" SET is_active = ${isActive}, updated_at = NOW()
      WHERE batch_name = ${batchName}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/admin/batch-forms]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
