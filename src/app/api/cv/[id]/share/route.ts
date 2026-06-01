export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const draft = await prisma.cvDraft.findUnique({ where: { id }, select: { userId: true, shareSlug: true } });
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (draft.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const slug = draft.shareSlug ?? randomBytes(12).toString("base64url");

    const updated = await prisma.cvDraft.update({
        where: { id },
        data: { shareSlug: slug, isPublic: true },
    });

    return NextResponse.json({ shareSlug: updated.shareSlug, isPublic: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const draft = await prisma.cvDraft.findUnique({ where: { id }, select: { userId: true } });
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (draft.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.cvDraft.update({
        where: { id },
        data: { shareSlug: null, isPublic: false },
    });

    return NextResponse.json({ isPublic: false });
}
