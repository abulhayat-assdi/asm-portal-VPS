import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const competitions = await prisma.competition.findMany({
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(competitions);
    } catch (error) {
        console.error("Failed to fetch competitions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden: Only Teachers and Admins can create competitions." }, { status: 403 });
        }

        const body = await req.json();
        
        if (!body.title || !body.title.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        if (!body.batchName || !body.batchName.trim()) {
            return NextResponse.json({ error: "Batch Name is required" }, { status: 400 });
        }

        const competition = await prisma.competition.create({
            data: {
                title: body.title.trim(),
                description: body.description ? body.description.trim() : "",
                batchName: body.batchName.trim(),
                schema: body.schema || [],
                isActive: body.isActive ?? true,
                startDate: body.startDate ? new Date(body.startDate) : new Date(),
                endDate: body.endDate ? new Date(body.endDate) : null,
            }
        });

        return NextResponse.json(competition);
    } catch (error: any) {
        console.error("Failed to create competition:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
