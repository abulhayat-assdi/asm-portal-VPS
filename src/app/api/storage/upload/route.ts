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
    // 🔒 Auth Check
    const session = request.cookies.get(COOKIES.SESSION)?.value;
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userUid: string;
    let userRole: string;
    try {
        const { adminAuth } = getAdminServices();
        const decodedToken = await adminAuth.verifyIdToken(session);
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
