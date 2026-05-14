import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getSessionUserFromRequestOrBearer } from "@/lib/auth";

/**
 * [API Route] Handle file uploads to local VPS storage
 * POST /api/storage/upload
 * FormData: { file, category (homework|resource), path (optional) }
 */
export async function POST(request: NextRequest) {
    // 🔒 CSRF: Reject requests whose Origin doesn't match our own domain.
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL || "",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://tasm-skill.asf.bd",
        "https://www.tasm-skill.asf.bd",
    ].filter(Boolean);
    const isLocalhost = origin.startsWith("http://localhost");
    const isAllowedOrigin = allowedOrigins.some(o => o && origin.startsWith(o));
    if (origin && !isLocalhost && !isAllowedOrigin) {
        console.warn(`[Security] CSRF blocked: unknown Origin: ${origin}`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔒 Auth Check — accepts both cookie and Authorization: Bearer header (for XHR uploads)
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

        // 🔒 SECURITY: Allowed types
        const ALLOWED_EXTENSIONS = new Set([
            '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp',
            '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
            '.csv', '.txt', '.zip', '.mp4', '.mp3'
        ]);

        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
        }

        // 📏 100 MB Size Limit
        const MAX_SIZE = 100 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large (Max 100MB)" }, { status: 400 });
        }

        const localStoragePath = "public";
        let storagePath = "";
        const timestamp = Date.now();
        const sanitizedFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        // 📁 Determine Folder Structure
        if (category === "homework") {
            storagePath = `homework/${sessionUser.id}/${sanitizedFileName}`;
        } else {
            const folder = subPath ? subPath.replace(/[^a-zA-Z0-9_]/g, "_") : "";
            storagePath = folder
                ? `resources/${folder}/${sanitizedFileName}`
                : `resources/${sanitizedFileName}`;
        }

        const absolutePath = path.resolve(process.cwd(), localStoragePath, storagePath);
        const dir = path.dirname(absolutePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(absolutePath, buffer);

        console.log(`[Upload API] Saved ${category} to ${storagePath}`);

        return NextResponse.json({
            success: true,
            fileUrl: `/${storagePath}`,
            storagePath: storagePath,
            fileName: file.name
        });

    } catch (error) {
        console.error("[Upload API] Error:", error);
        return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
    }
}
