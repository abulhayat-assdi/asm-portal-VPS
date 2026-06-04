import { prisma } from "@/lib/db";
import { getAllDefaultContent } from "@/lib/defaultCmsContent";

type DefaultKey = keyof ReturnType<typeof getAllDefaultContent>;

function mergeArray(dbArr: unknown, defArr: unknown): unknown[] {
    return (Array.isArray(dbArr) && dbArr.length > 0) ? dbArr as unknown[] : ((defArr as unknown[]) || []);
}

// Server-side CMS helper — queries DB directly (no HTTP round-trip)
export async function getCmsContent(pageId: string): Promise<Record<string, unknown>> {
    const defaults = getAllDefaultContent();
    const def = (defaults[pageId as DefaultKey] || {}) as Record<string, unknown>;

    try {
        const record = await prisma.cmsContent.findUnique({ where: { key: pageId } });
        if (!record) return def;

        const data = record.value as Record<string, unknown>;

        return {
            ...def,
            ...data,
            hero: { ...((def.hero as object) || {}), ...((data.hero as object) || {}) },
            header: { ...((def.header as object) || {}), ...((data.header as object) || {}) },
            targetAudience: { ...((def.targetAudience as object) || {}), ...((data.targetAudience as object) || {}) },
            learningOutcomes: { ...((def.learningOutcomes as object) || {}), ...((data.learningOutcomes as object) || {}) },
            socialHeader: { ...((def.socialHeader as object) || {}), ...((data.socialHeader as object) || {}) },
            aboutSection: { ...((def.aboutSection as object) || {}), ...((data.aboutSection as object) || {}) },
            whySection: { ...((def.whySection as object) || {}), ...((data.whySection as object) || {}) },
            ctaSection: { ...((def.ctaSection as object) || {}), ...((data.ctaSection as object) || {}) },
            contactInfo: { ...((def.contactInfo as object) || {}), ...((data.contactInfo as object) || {}) },
            socialGroups: mergeArray(data.socialGroups, def.socialGroups),
            audienceCards: mergeArray(data.audienceCards, def.audienceCards),
            courseHighlights: mergeArray(data.courseHighlights, def.courseHighlights),
            whyCards: mergeArray(data.whyCards, def.whyCards),
        };
    } catch {
        return def;
    }
}
