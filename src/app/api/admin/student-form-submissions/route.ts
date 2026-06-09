export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// GET /api/admin/student-form-submissions?batchName=...&status=pending
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchName = searchParams.get("batchName");
    const status = searchParams.get("status") || "pending";

    type RawSub = {
      id: string; batch_name: string; roll: string; name: string;
      phone: string; nid_birth_no: string; dob: string; email: string;
      blood_group: string; father_name: string; mother_name: string;
      present_address: string; permanent_address: string;
      guardian_name: string; guardian_phone: string;
      last_institute: string; latest_degree: string; gpa_result: string;
      current_district: string; home_district: string;
      category: string; t_shirt_size: string; total_payment: string; course_goal: string;
      status: string; admin_note: string | null;
      reviewed_at: Date | null; submitted_at: Date; updated_at: Date;
    };

    let rows: RawSub[];
    if (batchName) {
      rows = await prisma.$queryRaw<RawSub[]>`
        SELECT * FROM "student_form_submissions"
        WHERE batch_name = ${batchName} AND status = ${status}
        ORDER BY submitted_at DESC
      `;
    } else {
      rows = await prisma.$queryRaw<RawSub[]>`
        SELECT * FROM "student_form_submissions"
        WHERE status = ${status}
        ORDER BY submitted_at DESC
      `;
    }

    const result = rows.map((r) => ({
      id: r.id,
      batchName: r.batch_name,
      roll: r.roll,
      name: r.name,
      phone: r.phone,
      nidBirthNo: r.nid_birth_no,
      dob: r.dob,
      email: r.email,
      bloodGroup: r.blood_group,
      fatherName: r.father_name,
      motherName: r.mother_name,
      presentAddress: r.present_address,
      permanentAddress: r.permanent_address,
      guardianName: r.guardian_name,
      guardianPhone: r.guardian_phone,
      lastInstitute: r.last_institute,
      latestDegree: r.latest_degree,
      gpaResult: r.gpa_result,
      currentDistrict: r.current_district,
      homeDistrict: r.home_district,
      category: r.category,
      tShirtSize: r.t_shirt_size,
      totalPayment: r.total_payment,
      courseGoal: r.course_goal,
      status: r.status,
      adminNote: r.admin_note,
      submittedAt: r.submitted_at,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/student-form-submissions]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
