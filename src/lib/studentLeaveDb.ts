import { prisma } from "./db";

let dbCheckDone = false;

/**
 * Automatically ensures that table 'student_leave_requests' and all its columns
 * exist in PostgreSQL database. This prevents "column student_phone does not exist"
 * errors when database migrations haven't been run manually on production.
 */
export async function ensureStudentLeaveTableColumns() {
    if (dbCheckDone) return;
    try {
        // 1. Create table if not existing
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "student_leave_requests" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "student_uid" TEXT NOT NULL,
                "student_name" TEXT NOT NULL,
                "student_roll" TEXT NOT NULL,
                "student_phone" TEXT,
                "student_batch_name" TEXT NOT NULL,
                "start_date" TEXT NOT NULL,
                "end_date" TEXT NOT NULL,
                "reason" TEXT NOT NULL,
                "attachment_url" TEXT,
                "attachment_name" TEXT,
                "status" TEXT NOT NULL DEFAULT 'PENDING',
                "reviewed_by" TEXT,
                "review_note" TEXT,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Add any columns that might be missing on older database schemas
        await prisma.$executeRawUnsafe(`ALTER TABLE "student_leave_requests" ADD COLUMN IF NOT EXISTS "student_phone" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "student_leave_requests" ADD COLUMN IF NOT EXISTS "attachment_url" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "student_leave_requests" ADD COLUMN IF NOT EXISTS "attachment_name" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "student_leave_requests" ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "student_leave_requests" ADD COLUMN IF NOT EXISTS "review_note" TEXT;`);

        dbCheckDone = true;
    } catch (err) {
        console.warn("[StudentLeaveDB] Auto schema check warning:", err);
    }
}

/**
 * Safe helper to create a student leave request in Prisma,
 * with automatic column migration retry if DB schema is outdated.
 */
export async function safeCreateStudentLeaveRequest(data: {
    studentUid: string;
    studentName: string;
    studentRoll: string;
    studentPhone?: string | null;
    studentBatchName: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reviewedBy?: string | null;
}) {
    await ensureStudentLeaveTableColumns();

    try {
        return await prisma.studentLeaveRequest.create({
            data: {
                studentUid: data.studentUid,
                studentName: data.studentName,
                studentRoll: data.studentRoll,
                studentPhone: data.studentPhone || null,
                studentBatchName: data.studentBatchName,
                startDate: data.startDate,
                endDate: data.endDate,
                reason: data.reason,
                attachmentUrl: data.attachmentUrl || null,
                attachmentName: data.attachmentName || null,
                status: data.status,
                reviewedBy: data.reviewedBy || null,
            },
        });
    } catch (err: any) {
        // If error indicates missing column or enum issue, force migration & retry
        const errStr = String(err?.message || err);
        if (errStr.includes("does not exist") || errStr.includes("column") || errStr.includes("student_phone")) {
            console.warn("[StudentLeaveDB] Missing column detected during create. Running ALTER TABLE and retrying...");
            dbCheckDone = false;
            await ensureStudentLeaveTableColumns();

            return await prisma.studentLeaveRequest.create({
                data: {
                    studentUid: data.studentUid,
                    studentName: data.studentName,
                    studentRoll: data.studentRoll,
                    studentPhone: data.studentPhone || null,
                    studentBatchName: data.studentBatchName,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    reason: data.reason,
                    attachmentUrl: data.attachmentUrl || null,
                    attachmentName: data.attachmentName || null,
                    status: data.status,
                    reviewedBy: data.reviewedBy || null,
                },
            });
        }
        throw err;
    }
}
