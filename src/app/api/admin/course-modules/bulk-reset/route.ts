export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { modulesData } from "@/data/modules";

// Resets title + description + curriculum for every DB module that has a
// matching entry in modulesData (matched by slug first, then seed_key).
// Modules with no matching data file entry are left untouched.
export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const dbModules = await prisma.$queryRaw<
            { id: string; slug: string; seed_key: string; title: string }[]
        >`SELECT id, slug, seed_key, title FROM course_modules ORDER BY "order"`;

        const results: { slug: string; status: string }[] = [];
        const now = new Date().toISOString();

        for (const row of dbModules) {
            // Try slug first, then seed_key as fallback
            const dataKey = modulesData[row.slug]
                ? row.slug
                : modulesData[row.seed_key]
                ? row.seed_key
                : null;

            if (!dataKey) {
                results.push({ slug: row.slug, status: "skipped (no data file)" });
                continue;
            }

            const data = modulesData[dataKey];

            await prisma.$executeRaw`
                UPDATE course_modules SET
                    title       = ${data.title},
                    description = ${data.description},
                    curriculum  = ${JSON.stringify(data.modules)}::jsonb,
                    updated_at  = ${now}::timestamptz
                WHERE id = ${row.id}
            `;

            results.push({ slug: row.slug, status: `updated from '${dataKey}'` });
        }

        revalidatePath("/modules");

        return NextResponse.json({ results });
    } catch (error) {
        console.error("[bulk-reset] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        );
    }
}
