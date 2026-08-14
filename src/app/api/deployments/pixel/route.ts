// Public endpoint — no auth required (visitors call this from student sites)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";

// 1×1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
);

function getTodayDate(): string {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function hashIp(ip: string): string {
    return createHash("sha256").update(ip + (process.env.JWT_SECRET ?? "asm-pixel-salt")).digest("hex");
}

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

// ─── GET /api/deployments/pixel?id=<deploymentId> ────────────────────────────

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const deploymentId = searchParams.get("id")?.trim();

    if (!deploymentId) {
        return new NextResponse(TRANSPARENT_GIF, {
            headers: {
                "Content-Type": "image/gif",
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
            },
        });
    }

    // Fire-and-forget: record visit asynchronously, never delay the response
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const today = getTodayDate();
    const hashedIp = hashIp(clientIp);

    // Run DB update in background — don't await so the pixel returns instantly
    Promise.all([
        prisma.deployment.updateMany({
            where: { id: deploymentId },
            data: { totalVisitors: { increment: 1 } },
        }),
        prisma.visitorLog.create({
            data: {
                deploymentId,
                visitorIp: hashedIp,
                userAgent,
                date: today,
            },
        }),
    ]).catch((err) => {
        // Silently log — never surface to the visitor
        console.error("[Pixel] Failed to record visit:", err);
    });

    return new NextResponse(TRANSPARENT_GIF, {
        headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    });
}
