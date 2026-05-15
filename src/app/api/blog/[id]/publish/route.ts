import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/blog/[id]/publish — set status to published */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const post = await prisma.post.update({
            where: { id },
            data: { status: "published", publishedAt: new Date() },
        });
        return NextResponse.json(post);
    } catch (error) {
        console.error("Failed to publish post:", error);
        return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
    }
}
