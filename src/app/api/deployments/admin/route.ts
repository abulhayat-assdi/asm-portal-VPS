export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

// ─── GET /api/deployments/admin ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const caller = await getSessionUser(req);
    if (!caller || !isAdmin(caller)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

    try {
        const deployments = await prisma.deployment.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        studentBatchName: true,
                        studentRoll: true,
                        deploymentLimit: true,
                        isDeploymentFrozen: true,
                    },
                },
            },
        });

        const filtered = search
            ? deployments.filter((d) => {
                return (
                    d.subdomain.toLowerCase().includes(search) ||
                    d.user.displayName.toLowerCase().includes(search) ||
                    (d.user.studentRoll ?? "").toLowerCase().includes(search) ||
                    (d.user.studentBatchName ?? "").toLowerCase().includes(search)
                );
            })
            : deployments;

        const totalVisitors = deployments.reduce((sum, d) => sum + d.totalVisitors, 0);

        return NextResponse.json({
            deployments: filtered,
            stats: {
                total: deployments.length,
                totalVisitors,
            },
        });
    } catch (error) {
        console.error("[Deployments Admin GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
