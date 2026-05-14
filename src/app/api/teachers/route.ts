import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/teachers — public */
export async function GET() {
    try {
        const teachers = await prisma.teacher.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json(teachers);
    } catch (error) {
        console.error("[Teachers GET]", error);
        return NextResponse.json([], { status: 500 });
    }
}

/** PATCH /api/teachers — update teacher profile fields */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { id, ...data } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const teacher = await prisma.teacher.update({ where: { id }, data });
        return NextResponse.json(teacher);
    } catch (error) {
        console.error("[Teachers PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/teachers?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    try {
        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.$transaction(async (tx: any) => {
            await tx.teacher.delete({ where: { id } });
            if (teacher.loginEmail) {
                await tx.user.deleteMany({ where: { email: teacher.loginEmail } });
            }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Teachers DELETE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
