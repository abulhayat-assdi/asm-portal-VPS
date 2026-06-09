export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// PATCH /api/admin/student-form-submissions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { action, adminNote } = await req.json();

    type RawSub = {
      id: string; batch_name: string; roll: string; name: string;
      phone: string; nid_birth_no: string; dob: string; email: string;
      blood_group: string; father_name: string; mother_name: string;
      present_address: string; permanent_address: string;
      guardian_name: string; guardian_phone: string;
      last_institute: string; latest_degree: string; gpa_result: string;
      current_district: string; home_district: string;
      category: string; t_shirt_size: string; total_payment: string; course_goal: string;
      status: string;
    };

    const rows = await prisma.$queryRaw<RawSub[]>`
      SELECT * FROM "student_form_submissions" WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    const sub = rows[0];

    if (action === "approve") {
      // Update batch_students with submitted data
      await prisma.$executeRaw`
        UPDATE "batch_students" SET
          phone            = COALESCE(NULLIF(${sub.phone}, ''), phone),
          dob              = COALESCE(NULLIF(${sub.dob}, ''), dob),
          blood_group      = COALESCE(NULLIF(${sub.blood_group}, ''), blood_group),
          address          = COALESCE(NULLIF(${sub.present_address}, ''), address),
          educational_degree = COALESCE(NULLIF(${sub.latest_degree}, ''), educational_degree),
          email            = COALESCE(NULLIF(${sub.email}, ''), email),
          nid_birth_no     = COALESCE(NULLIF(${sub.nid_birth_no}, ''), nid_birth_no),
          father_name      = COALESCE(NULLIF(${sub.father_name}, ''), father_name),
          mother_name      = COALESCE(NULLIF(${sub.mother_name}, ''), mother_name),
          permanent_address = COALESCE(NULLIF(${sub.permanent_address}, ''), permanent_address),
          guardian_name    = COALESCE(NULLIF(${sub.guardian_name}, ''), guardian_name),
          guardian_phone   = COALESCE(NULLIF(${sub.guardian_phone}, ''), guardian_phone),
          last_institute   = COALESCE(NULLIF(${sub.last_institute}, ''), last_institute),
          latest_degree    = COALESCE(NULLIF(${sub.latest_degree}, ''), latest_degree),
          gpa_result       = COALESCE(NULLIF(${sub.gpa_result}, ''), gpa_result),
          current_district = COALESCE(NULLIF(${sub.current_district}, ''), current_district),
          home_district    = COALESCE(NULLIF(${sub.home_district}, ''), home_district),
          t_shirt_size     = COALESCE(NULLIF(${sub.t_shirt_size}, ''), t_shirt_size),
          total_paid_tk    = COALESCE(NULLIF(${sub.total_payment}, ''), total_paid_tk),
          course_goal      = COALESCE(NULLIF(${sub.course_goal}, ''), course_goal)
        WHERE batch_name = ${sub.batch_name} AND roll = ${sub.roll}
      `;

      // Handle category update separately (it's an enum column)
      if (sub.category === "Alim" || sub.category === "General") {
        await prisma.$executeRawUnsafe(
          `UPDATE "batch_students" SET category = $1::"StudentCategory" WHERE batch_name = $2 AND roll = $3`,
          sub.category, sub.batch_name, sub.roll
        );
      }

      const note = adminNote || null;
      await prisma.$executeRaw`
        UPDATE "student_form_submissions"
        SET status = 'approved', reviewed_at = NOW(), admin_note = ${note}, updated_at = NOW()
        WHERE id = ${id}
      `;

      return NextResponse.json({ success: true, action: "approved" });
    }

    if (action === "reject") {
      const note = adminNote || null;
      await prisma.$executeRaw`
        UPDATE "student_form_submissions"
        SET status = 'rejected', reviewed_at = NOW(), admin_note = ${note}, updated_at = NOW()
        WHERE id = ${id}
      `;
      return NextResponse.json({ success: true, action: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /api/admin/student-form-submissions/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
