import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getAdminServices } from "@/lib/firebase-admin";
import { COOKIES, AUTH_ROLES } from "@/lib/constants";

/**
 * [API Route] Handle file uploads to local cPanel storage
 * POST /api/storage/upload
 * FormData: { file, category (homework|resource), path (optional) }
 */
export async function POST(request: NextRequest) {
    // 🔒 CSRF: Reject requests whose Origin doesn't match our own domain.
    // This prevents malicious sites from tricking an authenticated user into uploading files.
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL || "",
        "http://localhost:3000",
        "http://localhost:3001",
    ].filter(Boolean);
    const isLocalhost = origin.startsWith("http://localhost");
    const isAllowedOrigin = allowedOrigins.some(o => o && origin.startsWith(o));
    if (origin && !isLocalhost && !isAllowedOrigin) {
        console.warn(`[Security] CSRF blocked: unknown Origin: ${origin}`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔒 Auth Check: Accept token from Authorization header (XHR uploads) or cookie (fallback)
    const authHeader = request.headers.get("Authorization");
    let session: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
        session = authHeader.substring(7); // Extract token from "Bearer <token>"
    } else {
        session = request.cookies.get(COOKIES.SESSION)?.value;
    }

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userUid: string;
    let userRole: string;
    try {
        const { adminAuth } = getAdminServices();
        // Branch: cookie needs verifySessionCookie; Bearer header needs verifyIdToken
        let decodedToken;
        const isCookieToken = session === request.cookies.get(COOKIES.SESSION)?.value;
        if (isCookieToken) {
            decodedToken = await adminAuth.verifySessionCookie(session, true);
        } else {
            decodedToken = await adminAuth.verifyIdToken(session);
        }
        userUid = decodedToken.uid;
        userRole = decodedToken.role as string;
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const category = (formData.get("category") as string) || "resource";
        const subPath = formData.get("path") as string; // Optional: module name, batch name etc.

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 🔒 SECURITY: Strict allowlist for file types — blocks .php, .exe, .sh, .html, etc.
        // Double-check both extension AND MIME type to defeat content-type spoofing.
        const ALLOWED_EXTENSIONS = new Set([
            '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp',
            '.docx', '.xlsx', '.csv', '.zip', '.mp4', '.mp3'
        ]);
        const ALLOWED_MIME_TYPES = new Set([
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'application/zip',
            'video/mp4',
            'audio/mpeg'
        ]);

        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.type)) {
            console.warn(`[Security] Blocked upload: type=${file.type}, ext=${ext}, uid=${userUid}`);
            return NextResponse.json(
                { error: "Invalid file type. Only standard documents, images, and media are allowed." },
                { status: 400 }
            );
        }

        // 📏 10 MB Size Limit
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large (Max 10MB)" }, { status: 400 });
        }

        const localStoragePath = process.env.LOCAL_STORAGE_PATH || "../storage";
        let storagePath = "";
        const timestamp = Date.now();
        const sanitizedFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        // 📁 Determine Folder Structure
        if (category === "homework") {
            // Path: private/homework/USER_UID/timestamp_filename.ext
            storagePath = `private/homework/${userUid}/${sanitizedFileName}`;
        } else {
            // Path: public/resources/SUBPATH/timestamp_filename.ext
            const folder = subPath ? subPath.replace(/[^a-zA-Z0-9_]/g, "_") : "";
            storagePath = folder 
                ? `public/resources/${folder}/${sanitizedFileName}`
                : `public/resources/${sanitizedFileName}`;
        }

        const absolutePath = path.resolve(process.cwd(), localStoragePath, storagePath);
        const dir = path.dirname(absolutePath);

        // 🔧 Ensure Directories Exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 💾 Save File
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(absolutePath, buffer);

        console.log(`[Upload API] Saved ${category} to ${storagePath}`);

        return NextResponse.json({
            success: true,
            fileUrl: `/api/file?path=${encodeURIComponent(storagePath)}`,
            storagePath: storagePath,
            fileName: file.name
        });

    } catch (error) {
        console.error("[Upload API] Error:", error);
        return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
    }
}
