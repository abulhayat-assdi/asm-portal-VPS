import { MetadataRoute } from "next";
import { getPublishedPostsServer } from "@/lib/blog-server";
import { prisma } from "@/lib/db";

const BASE_URL = "https://tasm-skill.asf.bd";

const FALLBACK_MODULE_SLUGS = [
    "sales-mastery",
    "career-planning-branding",
    "customer-service-excellence",
    "ai-for-digital-marketers",
    "digital-marketing",
    "business-management-tools",
    "landing-page-content-marketing",
    "business-english",
    "dawah-business-ethics",
];

async function getModuleSlugs(): Promise<string[]> {
    try {
        const rows = await prisma.$queryRaw<{ slug: string }[]>`
            SELECT slug FROM course_modules WHERE is_published = true
        `;
        if (rows.length > 0) return rows.map((r) => r.slug);
    } catch {
        // fall back to hardcoded list
    }
    return FALLBACK_MODULE_SLUGS;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [posts, moduleSlugs] = await Promise.all([
        getPublishedPostsServer(),
        getModuleSlugs(),
    ]);

    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL,                              lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
        { url: `${BASE_URL}/about`,                   lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE_URL}/modules`,                 lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
        { url: `${BASE_URL}/instructors`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${BASE_URL}/success-stories`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
        { url: `${BASE_URL}/contact`,                 lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
        { url: `${BASE_URL}/blog`,                    lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
        { url: `${BASE_URL}/enroll`,                  lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    ];

    const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
    }));

    const modulePages: MetadataRoute.Sitemap = moduleSlugs.map((slug) => ({
        url: `${BASE_URL}/modules/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.8,
    }));

    return [...staticPages, ...blogPages, ...modulePages];
}
