import { prisma } from "@/lib/db";
import type { BlogPost } from "@/services/blogService";

export async function getPublishedPostsServer(limitCount?: number): Promise<BlogPost[]> {
    try {
        const posts = await prisma.post.findMany({
            where: { status: "published" },
            take: limitCount,
            orderBy: { publishedAt: "desc" },
        });
        return posts as unknown as BlogPost[];
    } catch (error) {
        console.error("Error fetching published posts:", error);
        return [];
    }
}

export async function getPostBySlugServer(slug: string): Promise<BlogPost | null> {
    try {
        const post = await prisma.post.findUnique({ where: { slug } });
        return post as unknown as BlogPost | null;
    } catch (error) {
        console.error("Error fetching post by slug:", error);
        return null;
    }
}
