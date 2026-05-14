import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/contact — admin gets all, student gets their own */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const studentUid = searchParams.get("studentUid");

    if (isAdmin(user) || user.role === "teacher") {
        const messages = await prisma.contactMessage.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(messages);
    }

    const messages = await prisma.contactMessage.findMany({
        where: { studentUid: studentUid || user.id },
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(messages);
}

/** POST /api/contact — student submits a message */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const {
            subject, message, studentUid, studentName, studentEmail,
            studentBatchName, studentRoll, date,
        } = body;

        if (!subject || !message) {
            return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
        }

        const msg = await prisma.contactMessage.create({
            data: {
                subject,
                message,
                studentUid: studentUid || user.id,
                studentName: studentName || user.displayName,
                studentEmail: studentEmail || user.email,
                studentBatchName: studentBatchName || user.studentBatchName || "",
                studentRoll: studentRoll || user.studentRoll || "",
                status: "unread",
                date: date || new Date().toISOString().split("T")[0],
            },
        });

        return NextResponse.json({ id: msg.id, success: true }, { status: 201 });
    } catch (error) {
        console.error("[Contact POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/contact — update status or add reply */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status, adminReply } = body;

        const data: any = {};
        if (status) data.status = status;
        if (adminReply !== undefined) data.adminReply = adminReply;

        const msg = await prisma.contactMessage.update({ where: { id }, data });
        return NextResponse.json(msg);
    } catch (error) {
        console.error("[Contact PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/contact?id=... — admin only */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.contactMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
