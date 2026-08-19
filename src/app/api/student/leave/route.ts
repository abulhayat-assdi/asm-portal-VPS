export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSessionUser } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSessionUser();
        if (!session || session.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const leaveRequests = await prisma.studentLeaveRequest.findMany({
            where: {
                studentUid: session.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Fetch user profile from DB as fallback for batch & roll info
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { displayName: true, studentBatchName: true, studentRoll: true }
        });

        const batchName = user?.studentBatchName || session.studentBatchName || "";
        const roll = user?.studentRoll || session.studentRoll || "";

        // Check student batch status to see if leave application is allowed
        let canApply = true;
        let batchStatus = "Running";

        if (batchName) {
            const batch = await prisma.batch.findUnique({
                where: { name: batchName },
                select: { status: true },
            });
            if (batch && batch.status === "archived") {
                canApply = false;
                batchStatus = "Completed";
            }

            if (canApply && roll) {
                const studentInfo = await prisma.batchStudent.findUnique({
                    where: {
                        batchName_roll: {
                            batchName: batchName,
                            roll: roll,
                        },
                    },
                    select: { batchType: true },
                });
                if (studentInfo && studentInfo.batchType === "Completed") {
                    canApply = false;
                    batchStatus = "Completed";
                }
            }
        }

        return NextResponse.json({
            requests: leaveRequests,
            canApply,
            batchStatus,
            batchName: batchName,
        });
    } catch (error) {
        console.error("Error fetching student leave requests:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSessionUser();
        if (!session || session.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch fresh user profile from DB to get accurate student details
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { displayName: true, studentBatchName: true, studentRoll: true }
        });

        const batchName = user?.studentBatchName || session.studentBatchName || "";
        const roll = user?.studentRoll || session.studentRoll || "";
        const studentName = user?.displayName || session.displayName || "Unknown";

        // Check if student batch is completed (archived)
        if (batchName) {
            const batch = await prisma.batch.findUnique({
                where: { name: batchName },
                select: { status: true },
            });
            if (batch && batch.status === "archived") {
                return NextResponse.json({ error: "Leave requests are closed because your batch has been completed." }, { status: 403 });
            }

            if (roll) {
                const studentInfo = await prisma.batchStudent.findUnique({
                    where: {
                        batchName_roll: {
                            batchName: batchName,
                            roll: roll,
                        },
                    },
                    select: { batchType: true, phone: true },
                });
                if (studentInfo && studentInfo.batchType === "Completed") {
                    return NextResponse.json({ error: "Leave requests are closed because your batch has been completed." }, { status: 403 });
                }
            }
        }

        const { startDate, endDate, reason, attachmentUrl, attachmentName, studentPhone: reqPhone } = await req.json();

        if (!startDate || !endDate || !reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch student phone number if available
        let studentPhone = reqPhone || "";
        if (!studentPhone && batchName && roll) {
            try {
                const bStudent = await prisma.batchStudent.findUnique({
                    where: {
                        batchName_roll: {
                            batchName: batchName,
                            roll: roll,
                        },
                    },
                    select: { phone: true },
                });
                if (bStudent && bStudent.phone) {
                    studentPhone = bStudent.phone;
                }
            } catch (err) {
                console.warn("[StudentLeavePost] Warning querying phone from batchStudent:", err);
            }
        }

        const newLeaveRequest = await prisma.studentLeaveRequest.create({
            data: {
                studentUid: session.id,
                studentName: studentName,
                studentRoll: roll,
                studentPhone: studentPhone || null,
                studentBatchName: batchName,
                startDate,
                endDate,
                reason,
                attachmentUrl: attachmentUrl || null,
                attachmentName: attachmentName || null,
                status: "PENDING",
            },
        });

        return NextResponse.json(newLeaveRequest, { status: 201 });
    } catch (error) {
        console.error("Error creating student leave request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
