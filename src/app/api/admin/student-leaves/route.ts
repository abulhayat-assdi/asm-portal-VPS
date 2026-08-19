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
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal server error" 
        }, { status: 500 });
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
                    batchName: String(batchName).trim(),
                    roll: String(studentRoll).trim(),
                },
            },
        });

        if (!bStudent) {
            return NextResponse.json({ error: `Student record not found for batch "${batchName}" and roll "${studentRoll}".` }, { status: 404 });
        }

        // Check if student has a registered User account
        const userAccount = await prisma.user.findFirst({
            where: {
                studentBatchName: String(batchName).trim(),
                studentRoll: String(studentRoll).trim(),
            },
            select: { id: true },
        });

        // Normalize status enum
        let validStatus: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED";
        if (status && typeof status === "string") {
            const upper = status.toUpperCase();
            if (upper === "PENDING" || upper === "APPROVED" || upper === "REJECTED") {
                validStatus = upper;
            }
        }

        const newLeaveRequest = await prisma.studentLeaveRequest.create({
            data: {
                studentUid: userAccount?.id || bStudent.id,
                studentName: bStudent.name,
                studentRoll: bStudent.roll,
                studentPhone: bStudent.phone || null,
                studentBatchName: bStudent.batchName,
                startDate: String(startDate).trim(),
                endDate: String(endDate).trim(),
                reason: String(reason).trim(),
                status: validStatus,
                reviewedBy: session.id || null,
            },
        });

        return NextResponse.json(newLeaveRequest, { status: 201 });
    } catch (error) {
        console.error("Error creating student leave request by admin:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal server error" 
        }, { status: 500 });
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
            return NextResponse.json({ error: "Missing required fields (id, status)" }, { status: 400 });
        }

        // Normalize status enum
        let validStatus: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED";
        if (typeof status === "string") {
            const upper = status.toUpperCase();
            if (upper === "PENDING" || upper === "APPROVED" || upper === "REJECTED") {
                validStatus = upper;
            }
        }

        const updatedLeaveRequest = await prisma.studentLeaveRequest.update({
            where: { id },
            data: {
                status: validStatus,
                reviewNote: reviewNote !== undefined ? String(reviewNote).trim() : undefined,
                reviewedBy: session.id || null,
            },
        });

        return NextResponse.json(updatedLeaveRequest);
    } catch (error) {
        console.error("Error updating student leave request:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal server error" 
        }, { status: 500 });
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
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal server error" 
        }, { status: 500 });
    }
}
