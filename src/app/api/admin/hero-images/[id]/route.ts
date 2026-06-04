export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import path from "path";
import fs from "fs";

// PUT /api/admin/hero-images/[id] — update label, order, isActive
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { label, order, isActive } = body;

        const updated = await prisma.heroImage.update({
            where: { id },
            data: {
                ...(label !== undefined && { label: label || null }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json({ success: true, image: updated });
    } catch (error) {
        console.error("[Hero Images API] PUT Error:", error);
        return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
    }
}

// DELETE /api/admin/hero-images/[id] — delete DB record + file from disk
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        // Check minimum: don't allow deleting if it's the last active image
        const totalActive = await prisma.heroImage.count({ where: { isActive: true } });
        const imageToDelete = await prisma.heroImage.findUnique({ where: { id } });

        if (!imageToDelete) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        if (imageToDelete.isActive && totalActive <= 1) {
            return NextResponse.json({ error: "Cannot delete the last active hero image" }, { status: 400 });
        }

        // Delete the DB record first
        await prisma.heroImage.delete({ where: { id } });

        // Delete file from disk (only if it's in images/hero/ — don't delete seeded originals in images/home/)
        if (imageToDelete.storagePath.startsWith("images/hero/")) {
            const absolutePath = path.resolve(process.cwd(), "public", imageToDelete.storagePath);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Hero Images API] DELETE Error:", error);
        return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }
}
