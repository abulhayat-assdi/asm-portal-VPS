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

export const getPosts = async (limitCount?: number): Promise<BlogPost[]> => {
    try {
        const url = limitCount ? `/api/blog?limit=${limitCount}` : '/api/blog';
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
};

export const getPost = async (id: string): Promise<BlogPost | null> => {
    try {
        const res = await fetch(`/api/blog/${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
};

export const getPublishedPosts = async (limitCount?: number): Promise<BlogPost[]> => {
    try {
        const url = limitCount ? `/api/blog?limit=${limitCount}` : '/api/blog';
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        const posts: BlogPost[] = await res.json();
        return posts.filter(p => p.status === 'published');
    } catch {
        return [];
    }
};

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
