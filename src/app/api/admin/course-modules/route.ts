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
    teacher_name: string;
    teacher_email: string;
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
        teacherName: r.teacher_name ?? "",
        teacherEmail: r.teacher_email ?? "",
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export async function GET() {
    try {
        const rows = await prisma.$queryRaw<RawModule[]>`
            SELECT id, slug, title, description, pdf_link, bullets, curriculum,
                   is_published, "order", teacher_name, teacher_email, created_at, updated_at
            FROM course_modules
            ORDER BY "order" ASC, created_at ASC
        `;
        return NextResponse.json(rows.map(toClient));
    } catch (error) {
        console.error("[CourseModules API] GET Error:", error);
        const msg = error instanceof Error ? error.message : "Unknown";
        if (msg.includes('relation "course_modules" does not exist')) {
            return NextResponse.json(
                { error: "Migration not applied yet. Run: npx prisma migrate deploy" },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { slug, title, description, pdfLink, bullets, curriculum, isPublished, order, teacherName, teacherEmail } = body;

        if (!slug || !title) {
            return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
        }

        const existing = await prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM course_modules WHERE slug = ${slug} LIMIT 1
        `;
        if (existing.length > 0) {
            return NextResponse.json({ error: "A module with this slug already exists" }, { status: 409 });
        }

        const id = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date().toISOString();

        await prisma.$executeRaw`
            INSERT INTO course_modules (id, slug, title, description, pdf_link, bullets, curriculum, is_published, "order", teacher_name, teacher_email, created_at, updated_at)
            VALUES (
                ${id},
                ${slug},
                ${title},
                ${description ?? ""},
                ${pdfLink ?? ""},
                ${JSON.stringify(bullets ?? [])}::jsonb,
                ${JSON.stringify(curriculum ?? [])}::jsonb,
                ${isPublished ?? true},
                ${order ?? 0},
                ${teacherName ?? ""},
                ${teacherEmail ?? ""},
                ${now}::timestamptz,
                ${now}::timestamptz
            )
        `;

        const [row] = await prisma.$queryRaw<RawModule[]>`
            SELECT id, slug, title, description, pdf_link, bullets, curriculum,
                   is_published, "order", teacher_name, teacher_email, created_at, updated_at
            FROM course_modules WHERE id = ${id}
        `;

        revalidatePath("/modules");
        revalidatePath(`/modules/${slug}`);
        return NextResponse.json(toClient(row), { status: 201 });
    } catch (error) {
        console.error("[CourseModules API] POST Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
