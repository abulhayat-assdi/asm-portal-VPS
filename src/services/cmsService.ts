import {
    defaultHomePageContent,
    defaultAboutPageContent,
    defaultModulesPageContent,
    defaultSuccessStoriesPageContent,
    defaultContactPageContent,
    defaultBlogPageContent,
    defaultInstructorsPageContent
} from "@/lib/defaultCmsContent";

// ============================================================
// cmsService — All Firestore calls replaced with API calls
// ============================================================

const PAGE_DEFAULTS: Record<string, object> = {
    home_page: defaultHomePageContent,
    about_page: defaultAboutPageContent,
    modules_page: defaultModulesPageContent,
    instructors_page: defaultInstructorsPageContent,
    success_stories_page: defaultSuccessStoriesPageContent,
    contact_page: defaultContactPageContent,
    blog_page: defaultBlogPageContent,
};

export const getPageContent = async (pageId: string): Promise<object> => {
    try {
        const res = await fetch(`/api/cms?pageId=${encodeURIComponent(pageId)}`, { next: { revalidate: 60 } });
        const def = PAGE_DEFAULTS[pageId] || {};

        if (!res.ok) return def;

        const data = await res.json();
        const d = def as any;

        // Safe merge of sections — same logic as before
        return {
            ...d,
            ...data,
            hero: { ...(d.hero || {}), ...(data.hero || {}) },
            header: { ...(d.header || {}), ...(data.header || {}) },
            targetAudience: { ...(d.targetAudience || {}), ...(data.targetAudience || {}) },
            learningOutcomes: { ...(d.learningOutcomes || {}), ...(data.learningOutcomes || {}) },
            socialHeader: { ...(d.socialHeader || {}), ...(data.socialHeader || {}) },
            aboutSection: { ...(d.aboutSection || {}), ...(data.aboutSection || {}) },
            whySection: { ...(d.whySection || {}), ...(data.whySection || {}) },
            ctaSection: { ...(d.ctaSection || {}), ...(data.ctaSection || {}) },
        };
    } catch (error) {
        console.error(`Error fetching page content for ${pageId}:`, error);
        return PAGE_DEFAULTS[pageId] || {};
    }
};

export const updatePageContent = async (pageId: string, data: object): Promise<{ success: boolean }> => {
    const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, content: data }),
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to update page content.");
    }
    return { success: true };
};
