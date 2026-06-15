import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Best-effort removal of a previously uploaded file from disk.
async function removeUploadedFile(storagePath?: string | null) {
    if (!storagePath) return;
    try {
        const storageBase = process.env.LOCAL_STORAGE_PATH
            || process.env.UPLOAD_DIR
            || path.join(process.cwd(), "public");
        const clean = storagePath.startsWith("/api/uploads/")
            ? storagePath.replace(/^\/api\/uploads\//, "")
            : storagePath.startsWith("/")
                ? storagePath.slice(1)
                : storagePath;
        const filePath = path.resolve(storageBase, clean);
        if (!filePath.startsWith(storageBase + path.sep) && filePath !== storageBase) return; // traversal guard
        await unlink(filePath);
    } catch (e: any) {
        if (e?.code !== "ENOENT") console.warn("[Routines] could not delete old file:", e?.message);
    }
}

/** GET /api/routines?batchName=...  — latest routine image first */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batchName = searchParams.get("batchName");

    const where: any = {};
    if (batchName) where.batchName = { equals: batchName.trim(), mode: "insensitive" };

    const routines = await prisma.routine.findMany({ where, orderBy: { createdAt: "desc" } });

    const normalized = routines.map(routine => ({
        ...routine,
        fileUrl: routine.fileUrl.startsWith("/api/uploads/")
            ? routine.fileUrl
            : `/api/uploads/${(routine.fileUrl.startsWith("/") ? routine.fileUrl.slice(1) : routine.fileUrl)}`,
    }));

    return NextResponse.json(normalized);
}

/**
 * POST /api/routines — upload/replace the routine image for a batch.
 * Only one image is kept per batch: previous rows (and their files) are removed.
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { batchName, fileUrl, storagePath, fileName, uploadedBy } = body;

        if (!batchName || !fileUrl) {
            return NextResponse.json({ error: "batchName and fileUrl are required" }, { status: 400 });
        }

        // Replace: drop any existing routine(s) for this batch + clean their files.
        const existing = await prisma.routine.findMany({ where: { batchName } });
        if (existing.length > 0) {
            await prisma.routine.deleteMany({ where: { batchName } });
            await Promise.all(existing.map(r => removeUploadedFile(r.storagePath)));
        }

        const routine = await prisma.routine.create({
            data: {
                batchName,
                fileUrl,
                storagePath: storagePath || fileUrl,
                fileName: fileName || "",
                uploadedBy: uploadedBy || user.id,
            },
        });

        return NextResponse.json(routine, { status: 201 });
    } catch (error) {
        console.error("[Routines POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/routines?id=...  — remove a routine image (and its file) */
export async function DELETE(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const routine = await prisma.routine.findUnique({ where: { id } });
    if (routine) {
        await prisma.routine.delete({ where: { id } });
        await removeUploadedFile(routine.storagePath);
    }
    return NextResponse.json({ success: true });
}
