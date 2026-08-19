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

        // Check student batch status to see if leave application is allowed
        let canApply = true;
        let batchStatus = "Running";

        if (session.studentBatchName) {
            const batch = await prisma.batch.findUnique({
                where: { name: session.studentBatchName },
                select: { status: true },
            });
            if (batch && batch.status === "archived") {
                canApply = false;
                batchStatus = "Completed";
            }

            if (canApply && session.studentRoll) {
                const studentInfo = await prisma.batchStudent.findUnique({
                    where: {
                        batchName_roll: {
                            batchName: session.studentBatchName,
                            roll: session.studentRoll,
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
            batchName: session.studentBatchName || "",
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

        // Check if student batch is completed (archived)
        if (session.studentBatchName) {
            const batch = await prisma.batch.findUnique({
                where: { name: session.studentBatchName },
                select: { status: true },
            });
            if (batch && batch.status === "archived") {
                return NextResponse.json({ error: "Leave requests are closed because your batch has been completed." }, { status: 403 });
            }

            if (session.studentRoll) {
                const studentInfo = await prisma.batchStudent.findUnique({
                    where: {
                        batchName_roll: {
                            batchName: session.studentBatchName,
                            roll: session.studentRoll,
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
        if (!studentPhone && session.studentBatchName && session.studentRoll) {
            const bStudent = await prisma.batchStudent.findUnique({
                where: {
                    batchName_roll: {
                        batchName: session.studentBatchName,
                        roll: session.studentRoll,
                    },
                },
                select: { phone: true },
            });
            if (bStudent && bStudent.phone) {
                studentPhone = bStudent.phone;
            }
        }

        const newLeaveRequest = await prisma.studentLeaveRequest.create({
            data: {
                studentUid: session.id,
                studentName: session.displayName || "Unknown",
                studentRoll: session.studentRoll || "",
                studentPhone: studentPhone || null,
                studentBatchName: session.studentBatchName || "",
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
