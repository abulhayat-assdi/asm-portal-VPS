import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
    ".pdf":  "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc":  "application/msword",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt":  "application/vnd.ms-powerpoint",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls":  "application/vnd.ms-excel",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".gif":  "image/gif",
    ".webp": "image/webp",
    ".zip":  "application/zip",
    ".mp4":  "video/mp4",
    ".mp3":  "audio/mpeg",
    ".txt":  "text/plain",
    ".csv":  "text/csv",
};

/**
 * GET /api/uploads/[...path]
 * Serves uploaded files from public/uploads/ on the VPS filesystem.
 * This is needed because output:'standalone' doesn't reliably serve runtime-written files
 * from the public/ directory as static assets.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: segments } = await params;
    const relPath = segments.map(s => s.replace(/\.\./g, "")).join("/");

    const configured = process.env.LOCAL_STORAGE_PATH || process.env.UPLOAD_DIR;
    const storageBase = configured
        ? (path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured))
        : path.resolve(process.cwd(), "public");

    // Support serving files whether they were saved with or without the "uploads/" directory prefix on disk.
    const relPathWithPrefix = `uploads/${relPath}`;
    const baseDir = storageBase;
    const fallbackBaseDir = path.resolve(process.cwd(), "public");

    const candidates = [
        { absolutePath: path.resolve(baseDir, relPathWithPrefix), allowedBase: baseDir },
        { absolutePath: path.resolve(fallbackBaseDir, relPathWithPrefix), allowedBase: fallbackBaseDir },
        { absolutePath: path.resolve(baseDir, relPath), allowedBase: baseDir },
        { absolutePath: path.resolve(fallbackBaseDir, relPath), allowedBase: fallbackBaseDir },
    ];

    let matchedCandidate = null;
    for (const c of candidates) {
        if (fs.existsSync(c.absolutePath)) {
            const stat = fs.statSync(c.absolutePath);
            if (stat.isFile()) {
                matchedCandidate = { ...c, stat };
                break;
            }
        }
    }

    if (!matchedCandidate) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const { absolutePath, allowedBase, stat } = matchedCandidate;

    // Security: prevent path traversal
    if (!absolutePath.startsWith(allowedBase + path.sep) && absolutePath !== allowedBase) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    const fileName = path.basename(absolutePath);

    const fileBuffer = fs.readFileSync(absolutePath);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            "Content-Type":        contentType,
            "Content-Length":      String(stat.size),
            "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
            "Cache-Control":       "public, max-age=31536000, immutable",
        },
    });
}
