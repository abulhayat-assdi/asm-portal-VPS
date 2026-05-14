import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/testimonials — published only */
export async function GET() {
    const items = await prisma.videoTestimonial.findMany({
        where: { isPublished: true },
        orderBy: { order: "asc" },
    });
    return NextResponse.json(items);
}

/** POST /api/testimonials */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, videoUrl, videoId, thumbnailUrl, description, isPublished, order, studentName } = body;

        const item = await prisma.videoTestimonial.create({
            data: {
                title: title || "",
                videoUrl: videoUrl || videoId ? `https://youtu.be/${videoId}` : "",
                thumbnailUrl: thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null),
                description: description || null,
                isPublished: isPublished ?? false,
                order: Number(order) || 0,
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error("[Testimonials POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/testimonials */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const item = await prisma.videoTestimonial.update({ where: { id }, data });
        return NextResponse.json(item);
    } catch (error) {
        console.error("[Testimonials PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/testimonials?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.videoTestimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
