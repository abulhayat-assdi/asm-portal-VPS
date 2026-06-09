export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { modulesData } from "@/data/modules";

// Updates the curriculum (and title/description) of an existing module from the data file.
// Tries slug first, then falls back to seed_key so renamed modules still work.
export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { slug } = await req.json();
        if (!slug) {
            return NextResponse.json({ error: "slug is required" }, { status: 400 });
        }

        // Try to find data by current slug first, then by seed_key
        let dataKey = slug;
        let data = modulesData[slug];

        if (!data) {
            // Look up seed_key in DB for this slug and try that as the data key
            const row = await prisma.$queryRaw<{ seed_key: string }[]>`
                SELECT seed_key FROM course_modules WHERE slug = ${slug} LIMIT 1
            `;
            if (row.length && row[0].seed_key && modulesData[row[0].seed_key]) {
                dataKey = row[0].seed_key;
                data = modulesData[row[0].seed_key];
            }
        }

        if (!data) {
            return NextResponse.json(
                { error: `No data file found for slug: ${slug}` },
                { status: 404 }
            );
        }

        const existing = await prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM course_modules WHERE slug = ${slug} LIMIT 1
        `;
        if (!existing.length) {
            return NextResponse.json(
                { error: `Module with slug '${slug}' not found in database` },
                { status: 404 }
            );
        }

        const now = new Date().toISOString();

        await prisma.$executeRaw`
            UPDATE course_modules SET
                title       = ${data.title},
                description = ${data.description},
                curriculum  = ${JSON.stringify(data.modules)}::jsonb,
                updated_at  = ${now}::timestamptz
            WHERE slug = ${slug}
        `;

        revalidatePath("/modules");
        revalidatePath(`/modules/${slug}`);

        return NextResponse.json({
            success: true,
            message: `'${slug}' curriculum updated from data file (key: ${dataKey}).`,
        });
    } catch (error) {
        console.error("[reset-curriculum] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        );
    }
}
