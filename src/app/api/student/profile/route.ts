export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { COOKIES } from "@/lib/constants";
import { verifyJWT } from "@/lib/auth";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIES.SESSION)?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = await verifyJWT(token);
        if (!session || session.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { studentBatchName, studentRoll } = session;
        if (!studentBatchName || !studentRoll) {
            return NextResponse.json({ error: "Student info missing from session" }, { status: 400 });
        }

        const student = await prisma.batchStudent.findUnique({
            where: {
                batchName_roll: {
                    batchName: studentBatchName,
                    roll: studentRoll,
                },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error("Error fetching student profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
