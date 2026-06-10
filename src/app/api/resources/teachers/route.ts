import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface ResourceTeacher {
    teacherUid: string;
    teacherName: string;
    designation: string;
    profileImageUrl: string | null;
    order: number;
}

/**
 * GET /api/resources/teachers
 * Returns all teachers joined with their User ID (for resource library linking).
 * Joins teachers.login_email = users.email to get the user.id (teacherUid).
 */
export async function GET() {
    try {
        const rows = await prisma.$queryRaw<Array<{
            teacherUid: string;
            teacherName: string;
            designation: string;
            profileImageUrl: string | null;
            order: number;
        }>>`
            SELECT
                u.id            AS "teacherUid",
                t.name          AS "teacherName",
                t.designation   AS "designation",
                t.profile_image_url AS "profileImageUrl",
                t."order"       AS "order"
            FROM teachers t
            JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(t.login_email))
            WHERE t.login_email IS NOT NULL AND t.login_email <> ''
            ORDER BY t."order" ASC
        `;

        return NextResponse.json(rows);
    } catch (error) {
        console.error("[ResourceTeachers GET]", error);
        return NextResponse.json([], { status: 500 });
    }
}
