import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getSessionUserFromRequestOrBearer } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Returns the base directory for stored files.
 * Uses LOCAL_STORAGE_PATH (Docker volume) → UPLOAD_DIR → <cwd>/public fallback.
 */
function getStorageBase(): string {
    const configured = process.env.LOCAL_STORAGE_PATH || process.env.UPLOAD_DIR;
    if (configured) {
        return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
    }
    return path.resolve(process.cwd(), "public");
}

/**
 * POST /api/storage/upload
 * FormData: { file, category (homework|resource), path (optional) }
 */
export async function POST(request: NextRequest) {
    const sessionUser = await getSessionUserFromRequestOrBearer(request);
    if (!sessionUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const category = (formData.get("category") as string) || "resource";
        const subPath = formData.get("path") as string;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const ALLOWED_EXTENSIONS = new Set([
            ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp",
            ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
            ".csv", ".txt", ".zip", ".mp4", ".mp3",
        ]);

        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
        }

        if (file.size > 100 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (Max 100MB)" }, { status: 400 });
        }

        const storageBase = getStorageBase();
        const timestamp = Date.now();
        const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        let storagePath: string;
        if (category === "homework") {
            storagePath = `uploads/homework/${sessionUser.id}/${safeName}`;
        } else {
            const folder = subPath ? subPath.replace(/[^a-zA-Z0-9_]/g, "_") : "";
            storagePath = folder
                ? `uploads/resources/${folder}/${safeName}`
                : `uploads/resources/${safeName}`;
        }

        const absolutePath = path.join(storageBase, storagePath);
        const dir = path.dirname(absolutePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(absolutePath, buffer);

        console.log(`[Upload] ${category} saved → ${absolutePath}`);

        return NextResponse.json({
            success: true,
            fileUrl: `/${storagePath}`,
            storagePath,
            fileName: file.name,
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[Upload] Error:", msg);
        return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
    }
}
