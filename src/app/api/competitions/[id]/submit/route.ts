import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ensureCompetitionsTablesExist } from "@/lib/competitionsDb";

export const dynamic = "force-dynamic";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await ensureCompetitionsTablesExist();
        const { id } = await context.params;
        const user = await getSessionUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const competition = await prisma.competition.findUnique({
            where: { id }
        });

        if (!competition) {
            return NextResponse.json({ error: "Competition not found" }, { status: 404 });
        }

        if (!competition.isActive) {
            return NextResponse.json({ error: "Competition is not active" }, { status: 400 });
        }

        const body = await req.json();
        
        const submission = await prisma.competitionSubmission.create({
            data: {
                competitionId: id,
                type: body.type, // 'team' or 'individual'
                teamName: body.teamName,
                rollNumber: body.rollNumber,
                studentName: body.studentName,
                data: body.data,
            }
        });

        return NextResponse.json(submission);
    } catch (error) {
        console.error("Failed to submit competition data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
