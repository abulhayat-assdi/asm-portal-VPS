import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PATCH /api/student/update — admin directly updates student batch record */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, batchName, roll, ...data } = body;

        if (!id && !(batchName && roll)) {
            return NextResponse.json({ error: "id or batchName+roll required" }, { status: 400 });
        }

        let student;

        if (id) {
            student = await prisma.batchStudent.update({ where: { id }, data });
        } else {
            student = await prisma.batchStudent.update({
                where: { batchName_roll: { batchName, roll } },
                data,
            });
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error("[Student Update PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
