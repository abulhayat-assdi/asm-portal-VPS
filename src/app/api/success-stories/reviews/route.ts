import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/success-stories/reviews — published only for public, all for admin */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const user = await getSessionUser(req).catch(() => null);

    const where: any = {};
    if (!all || !user || !isAdmin(user)) {
        where.isPublished = true;
    }

    const stories = await prisma.successStory.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stories);
}

/** POST /api/success-stories/reviews */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, studentName, batch, role, company, story, quote, imageUrl, isPublished, rating, order } = body;

        const item = await prisma.successStory.create({
            data: {
                name: name || studentName || "",
                batch: batch || "",
                role: role || "",
                company: company || "",
                story: story || quote || "",
                imageUrl: imageUrl || null,
                isPublished: isPublished ?? false,
                rating: rating ?? 5,
                order: order ?? 0,
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error("[SuccessStories POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** PATCH /api/success-stories/reviews */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, studentName, quote, name, story, rating, order, ...rest } = body;
        const item = await prisma.successStory.update({
            where: { id },
            data: {
                ...rest,
                ...(studentName !== undefined && { name: studentName }),
                ...(name !== undefined && { name }),
                ...(quote !== undefined && { story: quote }),
                ...(story !== undefined && { story }),
                ...(rating !== undefined && { rating }),
                ...(order !== undefined && { order }),
            },
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error("[SuccessStories PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/success-stories/reviews?id=... */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.successStory.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
