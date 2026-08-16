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

        return NextResponse.json(leaveRequests);
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

        const { startDate, endDate, reason } = await req.json();

        if (!startDate || !endDate || !reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newLeaveRequest = await prisma.studentLeaveRequest.create({
            data: {
                studentUid: session.id,
                studentName: session.displayName || "Unknown",
                studentRoll: session.studentRoll || "",
                studentBatchName: session.studentBatchName || "",
                startDate,
                endDate,
                reason,
                status: "PENDING",
            },
        });

        return NextResponse.json(newLeaveRequest, { status: 201 });
    } catch (error) {
        console.error("Error creating student leave request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
