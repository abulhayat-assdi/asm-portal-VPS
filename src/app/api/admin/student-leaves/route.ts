import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSessionUser, isTeacherOrAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await getServerSessionUser();
        if (!session || !isTeacherOrAdmin(session)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const leaveRequests = await prisma.studentLeaveRequest.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(leaveRequests);
    } catch (error) {
        console.error("Error fetching student leave requests:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSessionUser();
        if (!session || !isTeacherOrAdmin(session)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { batchName, studentRoll, startDate, endDate, reason, status } = await req.json();

        if (!batchName || !studentRoll || !startDate || !endDate || !reason) {
            return NextResponse.json({ error: "All required fields (batch, roll, dates, reason) must be provided." }, { status: 400 });
        }

        // Find student details from BatchStudent model
        const bStudent = await prisma.batchStudent.findUnique({
            where: {
                batchName_roll: {
                    batchName,
                    roll: studentRoll,
                },
            },
        });

        if (!bStudent) {
            return NextResponse.json({ error: "Student record not found for the selected batch and roll." }, { status: 404 });
        }

        // Check if student has a registered User account
        const userAccount = await prisma.user.findFirst({
            where: {
                studentBatchName: batchName,
                studentRoll: studentRoll,
            },
            select: { id: true },
        });

        const newLeaveRequest = await prisma.studentLeaveRequest.create({
            data: {
                studentUid: userAccount?.id || bStudent.id,
                studentName: bStudent.name,
                studentRoll: bStudent.roll,
                studentPhone: bStudent.phone || null,
                studentBatchName: bStudent.batchName,
                startDate,
                endDate,
                reason,
                status: status || "APPROVED",
                reviewedBy: session.id,
            },
        });

        return NextResponse.json(newLeaveRequest, { status: 201 });
    } catch (error) {
        console.error("Error creating student leave request by admin:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSessionUser();
        if (!session || !isTeacherOrAdmin(session)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, status, reviewNote } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updatedLeaveRequest = await prisma.studentLeaveRequest.update({
            where: { id },
            data: {
                status,
                reviewNote,
                reviewedBy: session.id, // Storing ID of admin/teacher
            },
        });

        return NextResponse.json(updatedLeaveRequest);
    } catch (error) {
        console.error("Error updating student leave request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSessionUser();
        if (!session || !isTeacherOrAdmin(session)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Leave request ID is required" }, { status: 400 });
        }

        const leaveReq = await prisma.studentLeaveRequest.findUnique({
            where: { id },
        });

        if (!leaveReq) {
            return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
        }

        // Physical deletion of attachment file if exists
        if (leaveReq.attachmentUrl) {
            try {
                const cleanUrl = leaveReq.attachmentUrl.startsWith("/") ? leaveReq.attachmentUrl.slice(1) : leaveReq.attachmentUrl;
                const relativePath = cleanUrl.replace(/^api\/uploads\//, "");
                const storageBase = process.env.LOCAL_STORAGE_PATH || process.env.UPLOAD_DIR || path.resolve(process.cwd(), "public");
                const filePath = path.resolve(storageBase, relativePath);

                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                }
            } catch (err) {
                console.warn("[AdminLeaveDelete] Could not delete attachment file:", err);
            }
        }

        await prisma.studentLeaveRequest.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting student leave request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
