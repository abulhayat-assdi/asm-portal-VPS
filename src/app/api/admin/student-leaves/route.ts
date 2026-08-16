export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSessionUser, isTeacherOrAdmin } from "@/lib/auth";

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
