export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { MAX_CV_VERSIONS } from "@/lib/cv/constants";

async function checkDraftOwner(draftId: string, userId: string) {
    const draft = await prisma.cvDraft.findUnique({ where: { id: draftId } });
    if (!draft) return { draft: null, forbidden: false };
    if (draft.userId !== userId) return { draft: null, forbidden: true };
    return { draft, forbidden: false };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { draft, forbidden } = await checkDraftOwner(id, user.id);
    if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const versions = await prisma.cvVersion.findMany({
        where: { draftId: id },
        orderBy: { createdAt: "desc" },
        select: { id: true, label: true, createdAt: true },
    });

    return NextResponse.json(versions);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { draft, forbidden } = await checkDraftOwner(id, user.id);
    if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const label: string | undefined = body.label;

    // Auto-prune oldest if at limit
    const count = await prisma.cvVersion.count({ where: { draftId: id } });
    if (count >= MAX_CV_VERSIONS) {
        const oldest = await prisma.cvVersion.findFirst({
            where: { draftId: id },
            orderBy: { createdAt: "asc" },
        });
        if (oldest) await prisma.cvVersion.delete({ where: { id: oldest.id } });
    }

    // Snapshot: all draft fields except id, userId
    const { id: _id, userId: _uid, ...snapshot } = draft as Record<string, unknown>;
    void _id; void _uid;

    const version = await prisma.cvVersion.create({
        data: {
            draftId: id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            snapshot: snapshot as any,
            label: label || null,
        },
    });

    return NextResponse.json(version, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { draft, forbidden } = await checkDraftOwner(id, user.id);
    if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const versionId: string = body.versionId;
    if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 });

    const version = await prisma.cvVersion.findUnique({ where: { id: versionId } });
    if (!version || version.draftId !== id) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const snapshot = version.snapshot as Record<string, unknown>;

    // Restore all fields except protected ones
    const { id: _id, userId: _uid, shareSlug: _slug, downloadCount: _dl, ...restoreData } = snapshot;
    void _id; void _uid; void _slug; void _dl;

    const updated = await prisma.cvDraft.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: restoreData as any,
        include: { template: { select: { id: true, name: true, slug: true, config: true } } },
    });

    return NextResponse.json(updated);
}
