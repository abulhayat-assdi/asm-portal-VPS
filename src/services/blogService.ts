import { cache } from 'react';
import { prisma } from '@/lib/db';

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage?: string;
    content: string;
    category?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    status: 'draft' | 'published';
    createdAt: string | Date | null;
    publishedAt?: string | Date | null;
    updatedAt?: string | Date | null;
}

export const getPosts = cache(async (limitCount?: number): Promise<BlogPost[]> => {
    try {
        const posts = await prisma.post.findMany({
            take: limitCount,
            orderBy: { createdAt: 'desc' },
        });
        return posts as any;
    } catch (error) {
        console.error("Error fetching posts from DB:", error);
        return [];
    }
});

/**
 * Fetch a post by its internal ID
 */
export const getPost = cache(async (id: string): Promise<BlogPost | null> => {
    try {
        const post = await prisma.post.findUnique({
            where: { id },
        });
        return post as any;
    } catch (error) {
        console.error("Error fetching post by ID from DB:", error);
        return null;
    }
});

/**
 * Fetch a post by its public slug
 */
export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
    try {
        const post = await prisma.post.findUnique({
            where: { slug },
        });
        return post as any;
    } catch (error) {
        console.error("Error fetching post by slug from DB:", error);
        return null;
    }
});

export const getPublishedPosts = cache(async (limitCount?: number): Promise<BlogPost[]> => {
    try {
        const posts = await prisma.post.findMany({
            where: { status: 'published' },
            take: limitCount,
            orderBy: { publishedAt: 'desc' },
        });
        return posts as any;
    } catch (error) {
        console.error("Error fetching published posts from DB:", error);
        return [];
    }
});

export const createPost = async (data: Omit<BlogPost, 'id' | 'createdAt'>): Promise<string> => {
    const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create post.');
    return result.id;
};

export const updatePost = async (id: string, data: Partial<BlogPost>): Promise<void> => {
    const res = await fetch(`/api/blog/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to update post.');
    }
};

export const publishPost = async (id: string): Promise<void> => {
    const res = await fetch(`/api/blog/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to publish post.');
    }
};

export const deletePost = async (id: string): Promise<void> => {
    const res = await fetch(`/api/blog/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to delete post.');
    }
};
