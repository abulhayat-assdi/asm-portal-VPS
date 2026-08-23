import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin, isTeacherOrAdmin } from "@/lib/auth";
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
        
        // Public form access allowed for GET requests
        if (!isPublic && !user) {
            // Still allow fetching basic active competition info for public submission forms
        }

        const competition = await prisma.competition.findUnique({
            where: { id }
        });

        if (!competition) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(competition);
    } catch (error) {
        console.error("Failed to fetch competition:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        
        const competition = await prisma.competition.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                batchName: body.batchName,
                schema: body.schema,
                isActive: body.isActive,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
            }
        });

        return NextResponse.json(competition);
    } catch (error) {
        console.error("Failed to update competition:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.competition.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete competition:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
