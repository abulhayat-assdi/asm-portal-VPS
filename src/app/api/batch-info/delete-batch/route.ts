export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// DELETE /api/batch-info/delete-batch?batchName=...
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchName = searchParams.get("batchName");

    if (!batchName?.trim()) {
      return NextResponse.json({ error: "batchName is required" }, { status: 400 });
    }

    // 1. Delete all student form submissions for this batch (raw SQL — table may not exist)
    try {
      await prisma.$executeRaw`
        DELETE FROM "student_form_submissions" WHERE batch_name = ${batchName}
      `;
    } catch { /* table may not exist yet */ }

    // 2. Delete batch form record (raw SQL)
    try {
      await prisma.$executeRaw`
        DELETE FROM "batch_forms" WHERE batch_name = ${batchName}
      `;
    } catch { /* table may not exist yet */ }

    // 3. Delete all BatchStudent records
    await prisma.batchStudent.deleteMany({ where: { batchName } });

    // 4. Delete the Batch record itself
    await prisma.batch.deleteMany({ where: { name: batchName } });

    return NextResponse.json({ success: true, deleted: batchName });
  } catch (err) {
    console.error("[DELETE /api/batch-info/delete-batch]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
