import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// File types that should go into /public/files/ instead of /public/images/
const PDF_MIME_TYPES = ["application/pdf"];
const PDF_EXTENSIONS = [".pdf"];

export async function POST(req: NextRequest) {
    try {
        const { adminAuth, adminDb } = getAdminServices();

        // Security Check: Only admins/teachers should upload
        const sessionCookie = req.cookies.get('__session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
            const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
            if (!userDoc.exists || (userDoc.data()?.role !== 'admin' && userDoc.data()?.role !== 'teacher')) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch (error) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const uploadSubPath = formData.get("path") as string || "general";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine if PDF or image, and set base directory accordingly
        const isPdf = PDF_MIME_TYPES.includes(file.type) ||
            PDF_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

        const baseDir = isPdf ? "files" : "images";
        const uploadDir = path.join(process.cwd(), "public", baseDir, uploadSubPath);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // Return the public URL path
        const relativePath = path.join(uploadSubPath, filename).replace(/\\/g, "/");
        const publicUrl = `/${baseDir}/${relativePath}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: relativePath
        });

    } catch (error: any) {
        console.error("Upload API Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
