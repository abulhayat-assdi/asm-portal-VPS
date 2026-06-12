import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isTeacherOrAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ConfigRow = {
    batch: string;
    title: string;
    subtitle: string;
    footer_text: string;
    hidden_categories: string | null;
    custom_categories: string | null;
};

async function ensureTable() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS routine_configs (
            id TEXT NOT NULL,
            batch TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            subtitle TEXT NOT NULL DEFAULT '',
            footer_text TEXT NOT NULL DEFAULT '',
            hidden_categories TEXT NOT NULL DEFAULT '[]',
            custom_categories TEXT NOT NULL DEFAULT '[]',
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT routine_configs_pkey PRIMARY KEY (id)
        )
    `);
    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS routine_configs_batch_key ON routine_configs(batch)
    `);
    await prisma.$executeRawUnsafe(`
        ALTER TABLE routine_configs ADD COLUMN IF NOT EXISTS hidden_categories TEXT NOT NULL DEFAULT '[]'
    `);
    await prisma.$executeRawUnsafe(`
        ALTER TABLE routine_configs ADD COLUMN IF NOT EXISTS custom_categories TEXT NOT NULL DEFAULT '[]'
    `);
}

function parseJson<T>(raw: string | null, fallback: T): T {
    try { return JSON.parse(raw ?? "[]") ?? fallback; } catch { return fallback; }
}

/** GET /api/routine-config?batch=... */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batch = searchParams.get("batch");
    if (!batch) return NextResponse.json({ error: "batch required" }, { status: 400 });

    try {
        await ensureTable();
        const rows = await prisma.$queryRaw<ConfigRow[]>`
            SELECT batch, title, subtitle, footer_text, hidden_categories, custom_categories
            FROM routine_configs
            WHERE LOWER(TRIM(batch)) = LOWER(TRIM(${batch}))
            LIMIT 1
        `;
        if (rows.length === 0) {
            return NextResponse.json({
                batch, title: "", subtitle: "", footerText: "",
                hiddenCategories: [], customCategories: [],
            });
        }
        const r = rows[0];
        return NextResponse.json({
            batch: r.batch,
            title: r.title,
            subtitle: r.subtitle,
            footerText: r.footer_text,
            hiddenCategories: parseJson<string[]>(r.hidden_categories, []),
            customCategories: parseJson<unknown[]>(r.custom_categories, []),
        });
    } catch (err: any) {
        console.error("[RoutineConfig GET]", err?.message);
        return NextResponse.json({
            batch, title: "", subtitle: "", footerText: "",
            hiddenCategories: [], customCategories: [],
        });
    }
}

/** PUT /api/routine-config */
export async function PUT(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user || !isTeacherOrAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { batch, title, subtitle, footerText, hiddenCategories, customCategories } = body;
        if (!batch) return NextResponse.json({ error: "batch required" }, { status: 400 });

        const t  = String(title ?? "");
        const s  = String(subtitle ?? "");
        const f  = String(footerText ?? "");
        const hc = JSON.stringify(Array.isArray(hiddenCategories) ? hiddenCategories : []);
        const cc = JSON.stringify(Array.isArray(customCategories) ? customCategories : []);
        const id = randomUUID();

        await ensureTable();

        await prisma.$executeRaw`
            INSERT INTO routine_configs
                (id, batch, title, subtitle, footer_text, hidden_categories, custom_categories, created_at, updated_at)
            VALUES (${id}, ${batch}, ${t}, ${s}, ${f}, ${hc}, ${cc}, NOW(), NOW())
            ON CONFLICT (batch) DO UPDATE SET
                title              = EXCLUDED.title,
                subtitle           = EXCLUDED.subtitle,
                footer_text        = EXCLUDED.footer_text,
                hidden_categories  = EXCLUDED.hidden_categories,
                custom_categories  = EXCLUDED.custom_categories,
                updated_at         = NOW()
        `;

        return NextResponse.json({
            success: true, batch, title: t, subtitle: s, footerText: f,
            hiddenCategories: JSON.parse(hc),
            customCategories: JSON.parse(cc),
        });
    } catch (error: any) {
        console.error("[RoutineConfig PUT]", error?.message);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
