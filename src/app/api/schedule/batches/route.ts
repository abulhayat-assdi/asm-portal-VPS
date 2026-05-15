import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/schedule/batches
 *  - Admin: returns ALL batches (active + archived) for management
 *  - Teacher: returns only active batches
 */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = isAdmin(user) ? {} : { status: "active" as const };

    const batches = await prisma.batch.findMany({
        where,
        orderBy: { name: "asc" },
    });

    return NextResponse.json(batches);
}

/** POST /api/schedule/batches — add a new batch (admin only) */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name?.trim()) {
        return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
    }

    const existing = await prisma.batch.findUnique({ where: { name: name.trim() } });
    if (existing) {
        return NextResponse.json({ error: "Batch already exists" }, { status: 409 });
    }

    const batch = await prisma.batch.create({
        data: { name: name.trim(), status: "active" },
    });

    return NextResponse.json(batch, { status: 201 });
}

/** PATCH /api/schedule/batches — toggle active/archived status (admin only) */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
        return NextResponse.json({ error: "Batch id and status are required" }, { status: 400 });
    }

    const batch = await prisma.batch.update({
        where: { id },
        data: { status },
    });

    return NextResponse.json(batch);
}

/** DELETE /api/schedule/batches — delete a batch (admin only) */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
        return NextResponse.json({ error: "Batch id is required" }, { status: 400 });
    }

    await prisma.batch.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
