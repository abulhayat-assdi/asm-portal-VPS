export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// Creates batch_forms + student_form_submissions tables and adds new columns
// to batch_students — bypasses prisma migrate for remote DB setups
export async function POST(req: NextRequest) {
  try {
    const caller = await getSessionUser(req);
    if (!caller || !isAdmin(caller)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 1. Add new columns to batch_students ──────────────────────────────
    const newCols = [
      ["email",             "TEXT"],
      ["nid_birth_no",      "TEXT"],
      ["father_name",       "TEXT"],
      ["mother_name",       "TEXT"],
      ["permanent_address", "TEXT"],
      ["guardian_name",     "TEXT"],
      ["guardian_phone",    "TEXT"],
      ["last_institute",    "TEXT"],
      ["latest_degree",     "TEXT"],
      ["gpa_result",        "TEXT"],
      ["current_district",  "TEXT"],
      ["home_district",     "TEXT"],
      ["t_shirt_size",      "TEXT"],
      ["course_goal",       "TEXT"],
    ] as const;

    for (const [col] of newCols) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "batch_students" ADD COLUMN IF NOT EXISTS "${col}" TEXT`
        );
      } catch {
        // column may already exist — safe to ignore
      }
    }

    // ── 1b. Add total_payment to student_form_submissions if exists ───────
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "student_form_submissions" ADD COLUMN IF NOT EXISTS "total_payment" TEXT NOT NULL DEFAULT ''`
      );
    } catch { /* table may not exist yet — safe to ignore */ }

    // ── 2. Create batch_forms ─────────────────────────────────────────────
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "batch_forms" (
        "id"          TEXT         NOT NULL,
        "batch_name"  TEXT         NOT NULL,
        "form_slug"   TEXT         NOT NULL,
        "is_active"   BOOLEAN      NOT NULL DEFAULT true,
        "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "batch_forms_pkey"           PRIMARY KEY ("id"),
        CONSTRAINT "batch_forms_batch_name_key" UNIQUE ("batch_name"),
        CONSTRAINT "batch_forms_form_slug_key"  UNIQUE ("form_slug")
      )
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "batch_forms_form_slug_idx" ON "batch_forms"("form_slug")
    `;

    // ── 3. Create student_form_submissions ────────────────────────────────
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "student_form_submissions" (
        "id"               TEXT         NOT NULL,
        "batch_form_id"    TEXT         NOT NULL,
        "batch_name"       TEXT         NOT NULL,
        "roll"             TEXT         NOT NULL,
        "name"             TEXT         NOT NULL,
        "phone"            TEXT         NOT NULL DEFAULT '',
        "nid_birth_no"     TEXT         NOT NULL DEFAULT '',
        "dob"              TEXT         NOT NULL DEFAULT '',
        "email"            TEXT         NOT NULL DEFAULT '',
        "blood_group"      TEXT         NOT NULL DEFAULT '',
        "father_name"      TEXT         NOT NULL DEFAULT '',
        "mother_name"      TEXT         NOT NULL DEFAULT '',
        "present_address"  TEXT         NOT NULL DEFAULT '',
        "permanent_address" TEXT        NOT NULL DEFAULT '',
        "guardian_name"    TEXT         NOT NULL DEFAULT '',
        "guardian_phone"   TEXT         NOT NULL DEFAULT '',
        "last_institute"   TEXT         NOT NULL DEFAULT '',
        "latest_degree"    TEXT         NOT NULL DEFAULT '',
        "gpa_result"       TEXT         NOT NULL DEFAULT '',
        "current_district" TEXT         NOT NULL DEFAULT '',
        "home_district"    TEXT         NOT NULL DEFAULT '',
        "category"         TEXT         NOT NULL DEFAULT '',
        "t_shirt_size"     TEXT         NOT NULL DEFAULT '',
        "total_payment"    TEXT         NOT NULL DEFAULT '',
        "course_goal"      TEXT         NOT NULL DEFAULT '',
        "status"           TEXT         NOT NULL DEFAULT 'pending',
        "admin_note"       TEXT,
        "reviewed_at"      TIMESTAMP(3),
        "submitted_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "student_form_submissions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "student_form_submissions_batch_roll_key" UNIQUE ("batch_name", "roll"),
        CONSTRAINT "student_form_submissions_batch_form_id_fkey"
          FOREIGN KEY ("batch_form_id") REFERENCES "batch_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "student_form_submissions_batch_name_idx"
        ON "student_form_submissions"("batch_name")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "student_form_submissions_status_idx"
        ON "student_form_submissions"("status")
    `;

    // ── 4. Register migration ─────────────────────────────────────────────
    try {
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations"
          (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          gen_random_uuid()::text,
          '0000000000000000000000000000000000000000000000000000000000000000',
          NOW(), '20260609000000_add_student_form_system',
          NULL, NULL, NOW(), 1
        )
        ON CONFLICT DO NOTHING
      `;
    } catch {
      // not critical
    }

    return NextResponse.json({ success: true, message: "Setup complete! Tables created and columns added." });
  } catch (error) {
    console.error("[batch-forms/setup-db]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
