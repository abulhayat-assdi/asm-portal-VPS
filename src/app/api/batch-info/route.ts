import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/batch-info
 * Fetch students for a batch or search by roll.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const batchName = searchParams.get("batchName");
        const roll = searchParams.get("roll");
        const isPublic = searchParams.get("public") === "true";
        const all = searchParams.get("all") === "true";

        // Auth check for non-public data
        if (!isPublic) {
            const user = await getSessionUser(req);
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const where: any = {};
        if (batchName) where.batchName = batchName;
        if (roll) where.roll = roll;
        if (isPublic) where.isPublic = true;

        if (all) {
            const students = await prisma.batchStudent.findMany({
                orderBy: { batchName: "asc" }
            });
            return NextResponse.json(students);
        }

        if (roll && batchName) {
            const student = await prisma.batchStudent.findUnique({
                where: {
                    batchName_roll: { batchName, roll }
                }
            });
            return NextResponse.json(student);
        }

        const students = await prisma.batchStudent.findMany({
            where,
            orderBy: { roll: "asc" }
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("Failed to fetch batch info:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/batch-info
 * Create a new student entry.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const student = await prisma.batchStudent.create({
            data: {
                batchId: body.batchId || "DEFAULT_BATCH", // Adjust as needed
                batchName: body.batchName,
                roll: body.roll,
                name: body.name,
                phone: body.phone || "",
                address: body.address || "",
                dob: body.dob,
                educationalDegree: body.educationalDegree,
                courseStatus: body.courseStatus || "Running",
                currentlyDoing: body.currentlyDoing,
                companyName: body.companyName || "",
                businessName: body.businessName || "",
                salary: body.salary || 0,
                batchType: body.batchType || "Running",
                isPublic: body.isPublic ?? true,
            }
        });

        return NextResponse.json(student);
    } catch (error) {
        console.error("Failed to create student:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
