import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/success-stories/videos */
export async function GET() {
    const videos = await prisma.videoStory.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(videos);
}

/** POST /api/success-stories/videos */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { youtubeUrl, videoId, title, label, studentName, batch, order } = body;

        const video = await prisma.videoStory.create({
            data: {
                youtubeUrl,
                videoId,
                title,
                label: label || "",
                studentName: studentName || "",
                batch: batch || "",
                order: Number(order) || 0,
            },
        });

        return NextResponse.json(video, { status: 201 });
    } catch (error) {
        console.error("[VideoStories POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/success-stories/videos */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const video = await prisma.videoStory.update({ where: { id }, data });
        return NextResponse.json(video);
    } catch (error) {
        console.error("[VideoStories PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/success-stories/videos?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.videoStory.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
