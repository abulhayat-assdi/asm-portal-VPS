import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getAdminServices } from "@/lib/firebase-admin";
import { COOKIES, AUTH_ROLES } from "@/lib/constants";

/**
 * [API Route] Physically delete a file from local cPanel storage
 * DELETE /api/storage/delete?path=...
 */
export async function DELETE(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");

    if (!filePath) {
        return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // 🔒 Auth Check
    const session = request.cookies.get(COOKIES.SESSION)?.value;
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { adminAuth } = getAdminServices();
        const decodedToken = await adminAuth.verifySessionCookie(session);
        const userRole = decodedToken.role as string;
        const userUid = decodedToken.uid;

        const localStoragePath = process.env.LOCAL_STORAGE_PATH || "../storage";
        const absolutePath = path.resolve(process.cwd(), localStoragePath, filePath);

        // 🔒 Security Check: Out-of-bounds protection
        const storageDir = path.resolve(process.cwd(), localStoragePath);
        if (!absolutePath.startsWith(storageDir)) {
            return NextResponse.json({ error: "Forbidden: Out of bounds" }, { status: 403 });
        }

        // ⚖️ Authorization Rules
        let isAuthorized = false;

        // Admins and Teachers have global delete permissions
        if (userRole === AUTH_ROLES.ADMIN || userRole === AUTH_ROLES.TEACHER) {
            isAuthorized = true;
        } 
        // Students can only delete files in their own homework folder
        else if (userRole === AUTH_ROLES.STUDENT && filePath.startsWith("private/homework/")) {
            const pathSegments = filePath.split("/");
            const pathUid = pathSegments[2];
            if (userUid === pathUid) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            console.warn(`[Delete API] Forbidden attempt by ${userUid} to delete ${filePath}`);
            return NextResponse.json({ error: "Forbidden: You do not have permission to delete this file" }, { status: 403 });
        }

        // 🗑️ Delete the File
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`[Delete API] File deleted: ${filePath}`);
            return NextResponse.json({ success: true, message: "File deleted" });
        } else {
            // If file doesn't exist, we return success anyway to keep DB in sync
            console.warn(`[Delete API] File not found on disk: ${filePath}`);
            return NextResponse.json({ success: true, message: "File not found on disk" });
        }

    } catch (error) {
        console.error("[Delete API] Auth/Delete Error:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
