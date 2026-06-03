export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type RawModule = {
    id: string;
    slug: string;
    title: string;
    description: string;
    pdf_link: string;
    bullets: unknown;
    curriculum: unknown;
    is_published: boolean;
    order: number;
    created_at: Date;
    updated_at: Date;
};

function toClient(r: RawModule) {
    return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        pdfLink: r.pdf_link,
        bullets: r.bullets,
        curriculum: r.curriculum,
        isPublished: r.is_published,
        order: r.order,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const rows = await prisma.$queryRaw<RawModule[]>`
            SELECT id, slug, title, description, pdf_link, bullets, curriculum,
                   is_published, "order", created_at, updated_at
            FROM course_modules WHERE id = ${id} LIMIT 1
        `;
        if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(toClient(rows[0]));
    } catch (error) {
        console.error("[CourseModules/[id]] GET Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const existing = await prisma.$queryRaw<RawModule[]>`
            SELECT id, slug FROM course_modules WHERE id = ${id} LIMIT 1
        `;
        if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const body = await req.json();
        const { slug, title, description, pdfLink, bullets, curriculum, isPublished, order } = body;
        const oldSlug = existing[0].slug;
        const now = new Date().toISOString();

        if (slug && slug !== oldSlug) {
            const conflict = await prisma.$queryRaw<{ id: string }[]>`
                SELECT id FROM course_modules WHERE slug = ${slug} AND id != ${id} LIMIT 1
            `;
            if (conflict.length) {
                return NextResponse.json({ error: "A module with this slug already exists" }, { status: 409 });
            }
        }

        await prisma.$executeRaw`
            UPDATE course_modules SET
                slug        = COALESCE(${slug ?? null}, slug),
                title       = COALESCE(${title ?? null}, title),
                description = COALESCE(${description ?? null}, description),
                pdf_link    = COALESCE(${pdfLink ?? null}, pdf_link),
                bullets     = COALESCE(${bullets != null ? JSON.stringify(bullets) : null}::jsonb, bullets),
                curriculum  = COALESCE(${curriculum != null ? JSON.stringify(curriculum) : null}::jsonb, curriculum),
                is_published = COALESCE(${isPublished ?? null}, is_published),
                "order"     = COALESCE(${order ?? null}, "order"),
                updated_at  = ${now}::timestamptz
            WHERE id = ${id}
        `;

        const [updated] = await prisma.$queryRaw<RawModule[]>`
            SELECT id, slug, title, description, pdf_link, bullets, curriculum,
                   is_published, "order", created_at, updated_at
            FROM course_modules WHERE id = ${id}
        `;

        revalidatePath("/modules");
        revalidatePath(`/modules/${updated.slug}`);
        if (slug && slug !== oldSlug) revalidatePath(`/modules/${oldSlug}`);
        return NextResponse.json(toClient(updated));
    } catch (error) {
        console.error("[CourseModules/[id]] PUT Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const existing = await prisma.$queryRaw<RawModule[]>`
            SELECT id, slug FROM course_modules WHERE id = ${id} LIMIT 1
        `;
        if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.$executeRaw`DELETE FROM course_modules WHERE id = ${id}`;

        revalidatePath("/modules");
        revalidatePath(`/modules/${existing[0].slug}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CourseModules/[id]] DELETE Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
