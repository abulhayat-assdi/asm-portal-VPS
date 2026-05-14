import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/policies?type=policy|meeting */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "policy";

    const items = await prisma.policy.findMany({
        where: { kind: type },
        orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(items);
}

/** POST /api/policies */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { type, title, date, version, meetingNumber, fileUrl, storagePath, sortOrder } = body;

        const item = await prisma.policy.create({
            data: {
                kind: type || "policy",
                title,
                date: date || new Date().toISOString().split("T")[0],
                version: version || "",
                meetingNumber: meetingNumber || "",
                fileUrl: fileUrl || "",
                storagePath: storagePath || "",
                sortOrder: Number(sortOrder) || 0,
                content: "",
                createdBy: user.id,
            },
        });

        return NextResponse.json({ id: item.id, ...item }, { status: 201 });
    } catch (error) {
        console.error("[Policies POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/policies */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const item = await prisma.policy.update({ where: { id }, data });
        return NextResponse.json(item);
    } catch (error) {
        console.error("[Policies PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/policies?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.policy.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
