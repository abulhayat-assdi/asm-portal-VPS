import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getAdminServices } from "@/lib/firebase-admin";
import { COOKIES, AUTH_ROLES } from "@/lib/constants";

/**
 * [API Route] Serve files from local cPanel storage
 * GET /api/file?path=public/resources/file.pdf
 * GET /api/file?path=private/homework/USER_UID/file.pdf
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");

    if (!filePath) {
        return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const localStoragePath = process.env.LOCAL_STORAGE_PATH || "../storage";
    const absolutePath = path.resolve(process.cwd(), localStoragePath, filePath);

    // 🔒 Security Check: Ensure path is within the storage directory
    const storageDir = path.resolve(process.cwd(), localStoragePath);
    if (!absolutePath.startsWith(storageDir)) {
        console.warn(`[File API] Out of bounds access attempt: ${absolutePath}`);
        return NextResponse.json({ error: "Forbidden: Out of bounds" }, { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 🔒 Authorization for Private Files (Homework)
    if (filePath.startsWith("private/homework/")) {
        const session = request.cookies.get(COOKIES.SESSION)?.value;
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const { adminAuth, adminDb } = getAdminServices();
            const decodedToken = await adminAuth.verifyIdToken(session);
            const userUid = decodedToken.uid;

            // Role is stored in Firestore (users collection), not as a Firebase Auth custom claim
            const userDoc = await adminDb.collection("users").doc(userUid).get();
            const userRole = (userDoc.data()?.role as string) || "";

            // Rules: Admin & Teacher see everything. Student sees only their UID folder.
            if (userRole === AUTH_ROLES.ADMIN || userRole === AUTH_ROLES.TEACHER) {
                // Granted — full access
            } else if (userRole === AUTH_ROLES.STUDENT) {
                const pathSegments = filePath.split("/");
                // Expected path: private/homework/USER_UID/filename
                const pathUid = pathSegments[2];
                if (userUid !== pathUid) {
                    console.warn(`[File API] Student ${userUid} tried to access ${pathUid}'s homework`);
                    return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
                }
            } else {
                console.warn(`[File API] Unknown role '${userRole}' for user ${userUid}`);
                return NextResponse.json({ error: "Forbidden: Unknown role" }, { status: 403 });
            }
        } catch (error) {
            console.error("[File API] Auth Error:", error);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    // 📄 Serve the File
    try {
        const stats = fs.statSync(absolutePath);
        const fileName = path.basename(absolutePath);
        const contentType = getContentType(fileName);

        // Standard node Readable to Web Stream conversion for Next.js
        const stream = fs.createReadStream(absolutePath);
        
        return new Response(stream as any, {
            headers: {
                "Content-Type": contentType,
                "Content-Length": stats.size.toString(),
                "Content-Disposition": `inline; filename="${fileName}"`,
                "Cache-Control": filePath.startsWith("public/") ? "public, max-age=31536000, immutable" : "private, no-cache",
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
        ".zip": "application/zip",
    };
    return mimeMap[ext] || "application/octet-stream";
}
