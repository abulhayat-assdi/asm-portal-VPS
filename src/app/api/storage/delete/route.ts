import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";
import { AUTH_ROLES } from "@/lib/constants";

/**
 * [API Route] Physically delete a file from local VPS storage
 * DELETE /api/storage/delete?path=...
 */
export async function DELETE(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");

    if (!filePath) {
        return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // 🔒 Auth Check
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const localStoragePath = "public";
    const absolutePath = path.resolve(process.cwd(), localStoragePath, filePath);

    // 🔒 Security Check: Out-of-bounds protection
    const storageDir = path.resolve(process.cwd(), localStoragePath);
    if (!absolutePath.startsWith(storageDir)) {
        return NextResponse.json({ error: "Forbidden: Out of bounds" }, { status: 403 });
    }

    // ⚖️ Authorization Rules
    let isAuthorized = false;

    // Admins and Teachers have global delete permissions
    if (isTeacherOrAdmin(sessionUser)) {
        isAuthorized = true;
    }
    // Students can only delete files in their own homework folder
    else if (sessionUser.role === AUTH_ROLES.STUDENT && filePath.startsWith("homework/")) {
        const pathSegments = filePath.split("/");
        const pathUid = pathSegments[1]; // homework/{userId}/...
        if (sessionUser.id === pathUid) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        console.warn(`[Delete API] Forbidden attempt by ${sessionUser.id} to delete ${filePath}`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🗑️ Delete the File
    try {
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`[Delete API] File deleted: ${filePath}`);
            return NextResponse.json({ success: true, message: "File deleted" });
        } else {
            // File not on disk — return success to keep DB in sync
            console.warn(`[Delete API] File not found on disk: ${filePath}`);
            return NextResponse.json({ success: true, message: "File not found on disk" });
        }
    } catch (error) {
        console.error("[Delete API] Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}
