export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { mkdir, rm } from "fs/promises";
import path from "path";
import * as fs from "fs";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import * as cheerio from "cheerio";
import { readFile, writeFile, rename } from "fs/promises";

const STUDENT_SITES_BASE = process.env.STUDENT_SITES_PATH || "/var/www/student-sites";
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";

const RESERVED_SUBDOMAINS = new Set([
    "www", "api", "admin", "mail", "portal", "app", "cdn", "ftp",
    "smtp", "imap", "pop", "dev", "staging", "test", "demo", "static",
    "assets", "media", "img", "images", "upload", "uploads",
]);

const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

function buildLiveUrl(subdomain: string): string {
    return `https://${subdomain}.${BASE_DOMAIN}`;
}

function safePath(base: string, subdomain: string): string {
    const resolved = path.resolve(base, subdomain);
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
        throw new Error("Invalid path: directory traversal detected.");
    }
    return resolved;
}

async function injectTrackingPixel(indexHtmlPath: string, deploymentId: string): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${BASE_DOMAIN}`;
    try {
        const html = await readFile(indexHtmlPath, "utf-8");
        const $ = cheerio.load(html);
        $(`img[data-asm-pixel]`).remove();
        const pixelTag = `<img src="${appUrl}/api/deployments/pixel?id=${deploymentId}" width="1" height="1" style="position:absolute;opacity:0;pointer-events:none" alt="" aria-hidden="true" data-asm-pixel="1">`;
        if ($("body").length) {
            $("body").append(pixelTag);
        } else {
            $.root().append(pixelTag);
        }
        await writeFile(indexHtmlPath, $.html(), "utf-8");
    } catch {
        console.warn(`[Deployments] Could not inject tracking pixel into ${indexHtmlPath}`);
    }
}

// ─── PATCH /api/deployments/[id] ─────────────────────────────────────────────
// Student (owner only): rename subdomain of existing deployment

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const deployment = await prisma.deployment.findUnique({ where: { id } });
        if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

        // Only the owner can rename (admins use the admin route for freeze/limit changes)
        if (deployment.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check if student is frozen
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { isDeploymentFrozen: true },
        });
        if (dbUser?.isDeploymentFrozen) {
            return NextResponse.json({ error: "Your deployment access has been frozen." }, { status: 403 });
        }

        const body = await req.json();
        const newSubdomain = (body.subdomain as string | undefined)?.toLowerCase().trim();
        const newDisplayName = (body.displayName as string | undefined)?.trim();

        if (!newSubdomain) {
            return NextResponse.json({ error: "New subdomain is required." }, { status: 400 });
        }

        // Validate format
        if (!SUBDOMAIN_REGEX.test(newSubdomain)) {
            return NextResponse.json({ error: "Invalid subdomain format." }, { status: 400 });
        }
        if (RESERVED_SUBDOMAINS.has(newSubdomain)) {
            return NextResponse.json({ error: `"${newSubdomain}" is a reserved subdomain.` }, { status: 400 });
        }

        // No change?
        if (newSubdomain === deployment.subdomain) {
            // Just update displayName if provided
            const updated = await prisma.deployment.update({
                where: { id },
                data: { displayName: newDisplayName ?? deployment.displayName },
            });
            return NextResponse.json({ deployment: updated });
        }

        // Check new subdomain uniqueness in DB
        const conflict = await prisma.deployment.findUnique({ where: { subdomain: newSubdomain } });
        if (conflict) {
            return NextResponse.json({ error: "This subdomain is already taken." }, { status: 409 });
        }

        // Compute paths
        const oldDir = deployment.folderPath;
        const newDir = safePath(STUDENT_SITES_BASE, newSubdomain);

        if (fs.existsSync(newDir)) {
            return NextResponse.json({ error: "A site with this subdomain already exists on the server." }, { status: 409 });
        }

        // Atomically rename on disk (works if same filesystem mount)
        try {
            await rename(oldDir, newDir);
        } catch {
            // Fallback: copy + delete if rename fails (e.g., cross-device)
            await mkdir(newDir, { recursive: true });
            // Use fs.cpSync (Node 16.7+)
            fs.cpSync(oldDir, newDir, { recursive: true });
            await rm(oldDir, { recursive: true, force: true });
        }

        const newLiveUrl = buildLiveUrl(newSubdomain);

        // Update DB
        const updated = await prisma.deployment.update({
            where: { id },
            data: {
                subdomain: newSubdomain,
                folderPath: newDir,
                liveUrl: newLiveUrl,
                displayName: newDisplayName ?? deployment.displayName,
            },
        });

        // Re-inject pixel in new location (deploymentId is same — pixel URL unchanged)
        const newIndexPath = path.join(newDir, "index.html");
        if (fs.existsSync(newIndexPath)) {
            await injectTrackingPixel(newIndexPath, id);
        }

        return NextResponse.json({ deployment: updated });
    } catch (error) {
        console.error("[Deployments PATCH]", error);
        const msg = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ─── DELETE /api/deployments/[id] ────────────────────────────────────────────
// Student (owner + not frozen) OR Admin: delete a deployment

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const deployment = await prisma.deployment.findUnique({ where: { id } });
        if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

        const adminCaller = isAdmin(user);
        const isOwner = deployment.userId === user.id;

        if (!adminCaller && !isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Student: frozen check
        if (!adminCaller && isOwner) {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { isDeploymentFrozen: true },
            });
            if (dbUser?.isDeploymentFrozen) {
                return NextResponse.json({ error: "Your deployment access has been frozen." }, { status: 403 });
            }
        }

        // Remove files from disk
        const folderPath = deployment.folderPath;
        if (fs.existsSync(folderPath)) {
            await rm(folderPath, { recursive: true, force: true });
        }

        // Delete from DB (cascades visitor_logs)
        await prisma.deployment.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Deployments DELETE]", error);
        const msg = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
