import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";
import { ensureCompetitionsTablesExist } from "@/lib/competitionsDb";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await ensureCompetitionsTablesExist();
        const { id } = await context.params;
        const { searchParams } = new URL(req.url);
        const isPublic = searchParams.get("public") === "true" || req.headers.get("referer")?.includes("/competitions/");
        const user = await getSessionUser(req);
        
        if (!isPublic && (!user || !isTeacherOrAdmin(user))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const competition = await prisma.competition.findUnique({
            where: { id },
            include: {
                submissions: true
            }
        });

        if (!competition) {
            return NextResponse.json({ error: "Competition not found" }, { status: 404 });
        }

        // We return the raw submissions and the form schema, 
        // and let the frontend calculate the aggregations dynamically.
        // If there are many submissions, we might want to aggregate here,
        // but since we need both Team and Individual leaderboards dynamically,
        // returning raw data is often best for dynamic charts unless it's too large.

        return NextResponse.json(competition);
    } catch (error) {
        console.error("Failed to fetch competition report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
