import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { verifyJWT } from "@/lib/auth";
import { COOKIES } from "@/lib/constants";

/**
 * [API Route] Serve files from local VPS storage
 * All uploads save to process.cwd()/public/{storagePath}
 * GET /api/file?path=homework/{uid}/file.pdf   (private, auth required)
 * GET /api/file?path=resources/folder/file.pdf  (private, auth required)
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");

    if (!filePath) {
        return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // All files are stored under public/ (written by /api/storage/upload)
    const baseDir = path.resolve(process.cwd(), "public");
    const absolutePath = path.resolve(baseDir, filePath);

    // 🔒 Security: prevent directory traversal
    if (!absolutePath.startsWith(baseDir)) {
        return NextResponse.json({ error: "Forbidden: Out of bounds" }, { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 🔒 Authorization: homework files require authentication
    if (filePath.startsWith("homework/")) {
        const token = request.cookies.get(COOKIES.SESSION)?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const session = await verifyJWT(token);
            const userRole = session.role.toLowerCase();

            if (userRole === "admin" || userRole === "teacher") {
                // Full access
            } else if (userRole === "student") {
                // homework/{userId}/filename — student can only access their own
                const pathSegments = filePath.split("/");
                const pathUid = pathSegments[1];
                if (session.id !== pathUid) {
                    return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
                }
            } else {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    // 📄 Serve the file
    try {
        const stats = fs.statSync(absolutePath);
        const fileName = path.basename(absolutePath);
        const contentType = getContentType(fileName);
        const stream = fs.createReadStream(absolutePath);

        return new Response(stream as any, {
            headers: {
                "Content-Type": contentType,
                "Content-Length": stats.size.toString(),
                "Content-Disposition": `inline; filename="${fileName}"`,
                "Cache-Control": filePath.startsWith("homework/")
                    ? "private, no-cache"
                    : "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("[File API] Stream Error:", error);
        return NextResponse.json({ error: "Error reading file" }, { status: 500 });
    }
}

function getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeMap: Record<string, string> = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".ppt": "application/vnd.ms-powerpoint",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls": "application/vnd.ms-excel",
        ".txt": "text/plain",
        ".mp4": "video/mp4",
        ".mp3": "audio/mpeg",
        ".zip": "application/zip",
    };
    return mimeMap[ext] || "application/octet-stream";
}
