import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Allowed MIME types for homework
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/zip",
  "application/x-zip-compressed",
];

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const studentName = (formData.get("studentName") as string) || "unknown";
    const studentId = (formData.get("studentId") as string) || "unknown";

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: "${file.type}". Allowed: JPEG, PNG, PDF, WORD, EXCEL, PPT, ZIP.` },
        { status: 400 }
      );
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File too large: ${sizeMB}MB. Maximum allowed is 100MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize extension
    const originalExt = file.name.split(".").pop()?.toLowerCase() || "bin";
    
    // Create unique filename with student context to avoid conflicts
    const timestamp = Date.now();
    const safeStudentId = studentId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeStudentId}-${timestamp}.${originalExt}`;

    // Define upload directory for homework in the public folder
    const uploadDir = join(process.cwd(), "public", "homework");

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Public URL for the file
    const publicUrl = `/homework/${filename}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename 
    }, { status: 201 });

  } catch (error) {
    console.error("Homework upload error:", error);
    return NextResponse.json({ error: "Server error during upload. Please try again." }, { status: 500 });
  }
}
