export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CvDocument } from "@/lib/cv/pdf/generatePdf";
import type { CvDraftFull } from "@/lib/cv/schemas";
import type { TemplateConfig } from "@/lib/cv/constants";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const draft = await prisma.cvDraft.findUnique({
        where: { id },
        include: { template: { select: { id: true, name: true, slug: true, config: true } } },
    });

    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (draft.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const defaultConfig: TemplateConfig = {
        primaryColor: "#1e3a5f",
        sidebarColor: "#1e3a5f",
        sidebarWidth: 38,
        fontFamily: "Helvetica",
        photoShape: "circle",
        showPhoto: true,
    };

    const fullData: CvDraftFull = {
        id: draft.id,
        userId: draft.userId,
        templateId: draft.templateId,
        title: draft.title,
        fullName: draft.fullName ?? "",
        profilePhoto: draft.profilePhoto ?? "",
        careerObjective: draft.careerObjective ?? "",
        phone: draft.phone ?? "",
        email: draft.email ?? "",
        address: draft.address ?? "",
        dateOfBirth: draft.dateOfBirth ?? "",
        bloodGroup: draft.bloodGroup ?? "",
        religion: draft.religion ?? "",
        maritalStatus: draft.maritalStatus ?? "",
        nationality: draft.nationality ?? "",
        skills: (draft.skills as string[]) ?? [],
        languages: (draft.languages as CvDraftFull["languages"]) ?? [],
        hobbies: (draft.hobbies as string[]) ?? [],
        workExperience: (draft.workExperience as CvDraftFull["workExperience"]) ?? [],
        training: (draft.training as CvDraftFull["training"]) ?? [],
        education: (draft.education as CvDraftFull["education"]) ?? [],
        references: (draft.references as CvDraftFull["references"]) ?? [],
        declaration: draft.declaration ?? "",
        signature: draft.signature ?? "",
        sectionOrder: (draft.sectionOrder as string[]) ?? [
            "workExperience", "training", "education", "references",
        ],
        shareSlug: draft.shareSlug,
        isPublic: draft.isPublic,
        downloadCount: draft.downloadCount,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
        template: draft.template
            ? {
                  id: draft.template.id,
                  name: draft.template.name,
                  slug: draft.template.slug,
                  config: (draft.template.config as TemplateConfig) ?? defaultConfig,
              }
            : undefined,
    };

    try {
        // pdf().toBuffer() returns a Web ReadableStream<Uint8Array> — read all chunks
        const readableStream = pdf(<CvDocument data={fullData} />).toBuffer() as unknown as ReadableStream<Uint8Array>;
        const reader = readableStream.getReader();
        const chunks: Uint8Array[] = [];
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
        }
        const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

        const safeName = (fullData.fullName || "CV").replace(/[^a-zA-Z0-9 _-]/g, "_");
        const filename = `${safeName}_CV.pdf`;

        prisma.cvDraft
            .update({ where: { id }, data: { downloadCount: { increment: 1 } } })
            .catch(() => {});

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": String(buffer.length),
            },
        });
    } catch (err) {
        console.error("[PDF] generation error:", err instanceof Error ? err.message : err);
        return NextResponse.json(
            { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}
