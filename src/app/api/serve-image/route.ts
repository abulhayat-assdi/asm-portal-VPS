import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".avif": "image/avif",
};

// GET /api/serve-image?p=images/instructors/filename.jpg
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const p = searchParams.get("p");

  if (!p) return new NextResponse("Not found", { status: 404 });

  // Resolve from the same process.cwd()/public as the upload API
  const publicDir = path.join(process.cwd(), "public");

  // Clean prefix if p has leading / or api/uploads/ or uploads/
  const cleanP = p.replace(/^\/?(api\/uploads\/|uploads\/)/, "");
  let filePath = path.resolve(publicDir, cleanP);

  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(publicDir, p.startsWith("/") ? p.slice(1) : p);
  }

  // Security: prevent directory traversal
  if (!filePath.startsWith(publicDir + path.sep) && filePath !== publicDir) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
