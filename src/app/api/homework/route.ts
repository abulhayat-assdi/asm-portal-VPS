import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Idempotent migration — creates table if missing and adds any absent columns.
 */
async function ensureHomeworkSchema() {
    try {
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "homework_submissions" (
                "id"                TEXT        NOT NULL,
                "student_uid"       TEXT        NOT NULL,
                "student_name"      TEXT        NOT NULL,
                "student_roll"      TEXT        NOT NULL DEFAULT '',
                "student_batch_name" TEXT       NOT NULL DEFAULT '',
                "teacher_name"      TEXT        NOT NULL,
                "subject"           TEXT        NOT NULL,
                "file_url"          TEXT,
                "storage_path"      TEXT,
                "file_name"         TEXT,
                "files"             JSONB,
                "text_content"      TEXT,
                "submission_date"   TEXT        NOT NULL,
                "assignment_id"     TEXT,
                "submitted_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "deleted_at"        TIMESTAMPTZ,
                CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id")
            )
        `;
    } catch { /* table already exists */ }

    const cols: [string, string][] = [
        ["files",        "JSONB"],
        ["assignment_id","TEXT"],
        ["text_content", "TEXT"],
        ["deleted_at",   "TIMESTAMPTZ"],
        ["file_url",     "TEXT"],
        ["storage_path", "TEXT"],
        ["file_name",    "TEXT"],
    ];
    for (const [col, type] of cols) {
        try {
            await prisma.$executeRawUnsafe(
                `ALTER TABLE "homework_submissions" ADD COLUMN IF NOT EXISTS "${col}" ${type}`
            );
        } catch { /* column already exists */ }
    }
}

/** GET /api/homework?teacherName=...&studentUid=...&batchName=...&all=true */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const teacherName = searchParams.get("teacherName");
    const studentUid  = searchParams.get("studentUid");
    const batchName   = searchParams.get("batchName");
    const all         = searchParams.get("all") === "true";

    const where: Record<string, unknown> = { deletedAt: null };
    if (teacherName) where.teacherName      = teacherName;
    if (studentUid)  where.studentUid       = studentUid;
    if (batchName)   where.studentBatchName = batchName;

    if (all && !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const submissions = await prisma.homeworkSubmission.findMany({
            where,
            orderBy: { submittedAt: "desc" },
        });
        return NextResponse.json(submissions);
    } catch (error) {
        console.warn("[Homework GET] schema not ready, migrating...", error);
        try {
            await ensureHomeworkSchema();
            const submissions = await prisma.homeworkSubmission.findMany({
                where,
                orderBy: { submittedAt: "desc" },
            });
            return NextResponse.json(submissions);
        } catch (retryError) {
            console.error("[Homework GET] after migration:", retryError);
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    }
}

/** POST /api/homework — submit homework */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const {
        studentUid, studentName, studentRoll, studentBatchName,
        teacherName, subject, files, fileUrl, storagePath, fileName,
        textContent, submissionDate, assignmentId,
    } = body;

    const submissionData = {
        studentUid:       studentUid       || user.id,
        studentName:      studentName      || user.displayName,
        studentRoll:      studentRoll      || user.studentRoll  || "",
        studentBatchName: studentBatchName || user.studentBatchName || "",
        teacherName:      teacherName      || "",
        subject:          subject          || "",
        files:            files            ?? null,
        fileUrl:          fileUrl          ?? null,
        storagePath:      storagePath      ?? null,
        fileName:         fileName         ?? null,
        textContent:      textContent      ?? null,
        submissionDate:   submissionDate   || new Date().toISOString().split("T")[0],
        assignmentId:     assignmentId     ?? null,
    };

    try {
        const submission = await prisma.homeworkSubmission.create({ data: submissionData });
        return NextResponse.json({ id: submission.id, success: true }, { status: 201 });
    } catch (firstError) {
        // Missing columns — auto-migrate and retry once
        console.warn("[Homework POST] first attempt failed, running schema migration...", firstError);
        try {
            await ensureHomeworkSchema();
            const submission = await prisma.homeworkSubmission.create({ data: submissionData });
            return NextResponse.json({ id: submission.id, success: true }, { status: 201 });
        } catch (retryError) {
            console.error("[Homework POST] after migration:", retryError);
            const msg = retryError instanceof Error ? retryError.message : String(retryError);
            return NextResponse.json({ error: msg }, { status: 500 });
        }
    }
}

/** DELETE /api/homework — soft delete submission */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const submission = await prisma.homeworkSubmission.findUnique({ where: { id } });
        if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (!isTeacherOrAdmin(user) && submission.studentUid !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.homeworkSubmission.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Homework DELETE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
