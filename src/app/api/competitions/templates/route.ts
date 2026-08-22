import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const templates = await prisma.competitionFormTemplate.findMany({
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Failed to fetch templates:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        
        const template = await prisma.competitionFormTemplate.create({
            data: {
                name: body.name,
                schema: body.schema,
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Failed to create template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
