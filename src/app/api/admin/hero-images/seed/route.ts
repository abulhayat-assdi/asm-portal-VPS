export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_IMAGES = [
    { url: "/images/home/hero-slide-1.jpg", storagePath: "images/home/hero-slide-1.jpg", label: "Hero Slide 1", order: 0 },
    { url: "/images/home/hero-slide-2.jpg", storagePath: "images/home/hero-slide-2.jpg", label: "Hero Slide 2", order: 1 },
    { url: "/images/home/audience-bg.JPG",  storagePath: "images/home/audience-bg.JPG",  label: "Audience Background", order: 2 },
];

// POST /api/admin/hero-images/seed
// Creates the hero_images table (if missing) and seeds default images.
export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 1. Ensure the table exists (idempotent CREATE TABLE IF NOT EXISTS)
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "hero_images" (
                "id"           TEXT         NOT NULL,
                "url"          TEXT         NOT NULL,
                "storage_path" TEXT         NOT NULL,
                "label"        TEXT,
                "order"        INTEGER      NOT NULL DEFAULT 0,
                "is_active"    BOOLEAN      NOT NULL DEFAULT true,
                "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "hero_images_pkey" PRIMARY KEY ("id")
            );
        `);

        // 2. Create indexes (idempotent)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "hero_images_order_idx"     ON "hero_images"("order");`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "hero_images_is_active_idx" ON "hero_images"("is_active");`);

        // 3. Check if already seeded
        const existing = await prisma.heroImage.count();
        if (existing > 0) {
            return NextResponse.json({ success: true, message: `Table already has ${existing} image(s). No seed needed.`, count: existing });
        }

        // 4. Seed default images
        await prisma.heroImage.createMany({
            data: DEFAULT_IMAGES.map(img => ({
                url: img.url,
                storagePath: img.storagePath,
                label: img.label,
                order: img.order,
                isActive: true,
            })),
            skipDuplicates: true,
        });

        const count = await prisma.heroImage.count();
        return NextResponse.json({ success: true, message: `Seeded ${count} default hero images.`, count });

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[Hero Images Seed] Error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
