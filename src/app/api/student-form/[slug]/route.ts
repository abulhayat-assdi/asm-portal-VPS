export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

type RawForm = { id: string; batch_name: string; is_active: boolean };
type RawRoll = { roll: string };
type RawStudent = { roll: string; name: string };

// GET /api/student-form/[slug]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const forms = await prisma.$queryRaw<RawForm[]>`
      SELECT id, batch_name, is_active FROM "batch_forms"
      WHERE form_slug = ${slug} LIMIT 1
    `;
    if (forms.length === 0) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    const form = forms[0];

    if (!form.is_active) {
      return NextResponse.json({ error: "This form is currently closed" }, { status: 403 });
    }

    // Rolls already submitted
    const submitted = await prisma.$queryRaw<RawRoll[]>`
      SELECT roll FROM "student_form_submissions" WHERE batch_name = ${form.batch_name}
    `;
    const submittedRolls = new Set(submitted.map((s) => s.roll));

    // All students in batch
    const students = await prisma.$queryRaw<RawStudent[]>`
      SELECT roll, name FROM "batch_students"
      WHERE batch_name = ${form.batch_name}
      ORDER BY roll ASC
    `;

    const available = students.filter((s) => !submittedRolls.has(s.roll));

    return NextResponse.json({ batchName: form.batch_name, students: available });
  } catch (err) {
    console.error("[GET /api/student-form]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/student-form/[slug]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const forms = await prisma.$queryRaw<RawForm[]>`
      SELECT id, batch_name, is_active FROM "batch_forms"
      WHERE form_slug = ${slug} LIMIT 1
    `;
    if (forms.length === 0) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    const form = forms[0];

    if (!form.is_active) {
      return NextResponse.json({ error: "This form is currently closed" }, { status: 403 });
    }

    const body = await req.json();
    const {
      roll, name, phone, nidBirthNo, dob, email, bloodGroup,
      fatherName, motherName, presentAddress, permanentAddress,
      guardianName, guardianPhone, lastInstitute, latestDegree,
      gpaResult, currentDistrict, homeDistrict, category, tShirtSize,
      totalPayment, courseGoal,
    } = body;

    // Validate required fields
    const required: Record<string, unknown> = {
      roll, name, phone, nidBirthNo, dob, email, bloodGroup,
      fatherName, motherName, presentAddress, permanentAddress,
      guardianName, guardianPhone, lastInstitute, latestDegree,
      gpaResult, currentDistrict, homeDistrict, category, tShirtSize,
      totalPayment, courseGoal,
    };
    for (const [key, val] of Object.entries(required)) {
      if (!val || String(val).trim() === "") {
        return NextResponse.json({ error: `Field '${key}' is required` }, { status: 400 });
      }
    }

    // Verify roll exists in batch
    const studentRows = await prisma.$queryRaw<{ roll: string }[]>`
      SELECT roll FROM "batch_students"
      WHERE batch_name = ${form.batch_name} AND roll = ${String(roll)} LIMIT 1
    `;
    if (studentRows.length === 0) {
      return NextResponse.json({ error: "Roll number not found in this batch" }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "student_form_submissions"
      WHERE batch_name = ${form.batch_name} AND roll = ${String(roll)} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: "You have already submitted the form" }, { status: 409 });
    }

    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "student_form_submissions" (
        id, batch_form_id, batch_name, roll, name, phone, nid_birth_no, dob, email,
        blood_group, father_name, mother_name, present_address, permanent_address,
        guardian_name, guardian_phone, last_institute, latest_degree, gpa_result,
        current_district, home_district, category, t_shirt_size, total_payment, course_goal,
        status, submitted_at, updated_at
      ) VALUES (
        ${id}, ${form.id}, ${form.batch_name}, ${String(roll)}, ${String(name)},
        ${String(phone)}, ${String(nidBirthNo)}, ${String(dob)}, ${String(email)},
        ${String(bloodGroup)}, ${String(fatherName)}, ${String(motherName)},
        ${String(presentAddress)}, ${String(permanentAddress)},
        ${String(guardianName)}, ${String(guardianPhone)},
        ${String(lastInstitute)}, ${String(latestDegree)}, ${String(gpaResult)},
        ${String(currentDistrict)}, ${String(homeDistrict)},
        ${String(category)}, ${String(tShirtSize)}, ${String(totalPayment)}, ${String(courseGoal)},
        'pending', NOW(), NOW()
      )
    `;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/student-form]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
