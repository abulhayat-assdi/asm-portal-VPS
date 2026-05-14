import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/blog/comments?postId=... */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

    const comments = await prisma.blogComment.findMany({
        where: { postId },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
        comments.map(c => ({
            id: c.id,
            postId: c.postId,
            authorName: c.name,
            content: c.content,
            createdAt: c.createdAt,
        }))
    );
}

/** POST /api/blog/comments */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { postId, authorName, content } = body;

        if (!postId || !authorName || !content) {
            return NextResponse.json({ error: "postId, authorName, and content required" }, { status: 400 });
        }

        const comment = await prisma.blogComment.create({
            data: { postId, name: authorName, content },
        });

        return NextResponse.json({
            id: comment.id,
            postId: comment.postId,
            authorName: comment.name,
            content: comment.content,
            createdAt: comment.createdAt,
        }, { status: 201 });
    } catch (error) {
        console.error("[Blog Comments POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/blog/comments?id=... — admin only */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.blogComment.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
