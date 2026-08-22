import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

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
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        
        const competition = await prisma.competition.create({
            data: {
                title: body.title,
                description: body.description || "",
                batchName: body.batchName,
                schema: body.schema,
                isActive: body.isActive ?? true,
                startDate: body.startDate ? new Date(body.startDate) : new Date(),
                endDate: body.endDate ? new Date(body.endDate) : null,
            }
        });

        return NextResponse.json(competition);
    } catch (error) {
        console.error("Failed to create competition:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
