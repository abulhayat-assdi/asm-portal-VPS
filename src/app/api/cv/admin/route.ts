export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const q = searchParams.get("q") ?? "";
    const pageSize = 20;

    const where = q
        ? {
              user: {
                  OR: [
                      { displayName: { contains: q, mode: "insensitive" as const } },
                      { email: { contains: q, mode: "insensitive" as const } },
                  ],
              },
          }
        : {};

    const [total, drafts] = await Promise.all([
        prisma.cvDraft.count({ where }),
        prisma.cvDraft.findMany({
            where,
            include: {
                user: { select: { id: true, displayName: true, email: true } },
                template: { select: { id: true, name: true } },
            },
            orderBy: { updatedAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
    ]);

    return NextResponse.json({ drafts, total, page, pages: Math.ceil(total / pageSize) });
}
