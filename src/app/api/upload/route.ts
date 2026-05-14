import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "images/instructors";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine the upload directory
    // If routines, we use public/documents/routines
    // Else use the provided path under public/
    let uploadSubDir = folder;
    if (folder === "routines") {
      uploadSubDir = "documents/routines";
    }

    const uploadDir = path.join(process.cwd(), "public", uploadSubDir);
    
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Generate a unique filename: timestamp-sanitized-name
    const cleanFileName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
    const uniqueFilename = `${Date.now()}-${cleanFileName}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Save the file
    await writeFile(filePath, buffer);

    // Return the public URL path
    const url = `/${uploadSubDir}/${uniqueFilename}`;
    return NextResponse.json({ url });
    } catch (error) {
    console.error("Error uploading file:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Convert public URL like `/documents/routines/xxx.pdf` to actual local path
    const cleanUrl = url.startsWith("/") ? url.slice(1) : url;
    const filePath = path.join(process.cwd(), "public", cleanUrl);

    // Prevent directory traversal attacks
    const publicDir = path.join(process.cwd(), "public");
    if (!filePath.startsWith(publicDir)) {
      return NextResponse.json({ error: "Forbidden: Out of bounds" }, { status: 403 });
    }

    try {
      await unlink(filePath);
    } catch (e: any) {
      // If file is already gone, that's fine
      if (e.code !== "ENOENT") {
        throw e;
      }
      console.warn("File to delete not found, ignoring:", filePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete file";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
