import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";
import { ensureCompetitionsTablesExist } from "@/lib/competitionsDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await ensureCompetitionsTablesExist();
        const { searchParams } = new URL(req.url);
        const batchName = searchParams.get("batchName");
        const competitionId = searchParams.get("competitionId");

        const where: any = {};
        if (batchName) where.batchName = batchName;
        if (competitionId) where.competitionId = competitionId;

        const groups = await (prisma as any).competitionGroup.findMany({
            where,
            orderBy: { groupName: "asc" }
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error("Failed to fetch competition groups:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureCompetitionsTablesExist();
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden: Only Teachers and Admins can manage groups." }, { status: 403 });
        }

        const body = await req.json();
        const { id, batchName, competitionId, groupName, members } = body;

        if (!batchName || !batchName.trim()) {
            return NextResponse.json({ error: "Batch Name is required" }, { status: 400 });
        }
        if (!groupName || !groupName.trim()) {
            return NextResponse.json({ error: "Group Name is required" }, { status: 400 });
        }

        if (id) {
            // Update existing group
            const updated = await (prisma as any).competitionGroup.update({
                where: { id },
                data: {
                    groupName: groupName.trim(),
                    batchName: batchName.trim(),
                    competitionId: competitionId || null,
                    members: members || [],
                }
            });
            return NextResponse.json(updated);
        } else {
            // Create new group
            const created = await (prisma as any).competitionGroup.create({
                data: {
                    groupName: groupName.trim(),
                    batchName: batchName.trim(),
                    competitionId: competitionId || null,
                    members: members || [],
                }
            });
            return NextResponse.json(created);
        }
    } catch (error: any) {
        console.error("Failed to create/update competition group:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await ensureCompetitionsTablesExist();
        const user = await getSessionUser(req);
        if (!user || !isTeacherOrAdmin(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        await (prisma as any).competitionGroup.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete competition group:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
