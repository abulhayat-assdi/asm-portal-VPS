// ============================================================
// commentService — All Firestore calls replaced with API calls
// ============================================================

export interface CommentReply {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
}

export interface BlogComment {
    id: string;
    postId: string;
    authorName: string;
    content: string;
    createdAt: string;
    likes?: number;
    replies?: CommentReply[];
}

export const getCommentsByBlogId = async (postId: string): Promise<BlogComment[]> => {
    try {
        const res = await fetch(`/api/blog/comments?postId=${encodeURIComponent(postId)}`, { cache: "no-store" });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
};

export const addComment = async (postId: string, authorName: string, content: string): Promise<BlogComment> => {
    const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, authorName, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add comment.");
    return data;
};

// ─── Backward-compat stubs ─────────────────────────────────

export const likeComment = async (commentId: string): Promise<void> => {
    await fetch(`/api/blog/comments/${encodeURIComponent(commentId)}/like`, { method: "PATCH" });
};

export const addReply = async (
    commentId: string,
    existingReplies: CommentReply[],
    authorName: string,
    content: string
): Promise<CommentReply[]> => {
    const newReply: CommentReply = {
        id: crypto.randomUUID(),
        authorName,
        content,
        createdAt: new Date().toISOString(),
    };
    // Fire-and-forget — replies stored in a flat array on the server
    fetch(`/api/blog/comments/${encodeURIComponent(commentId)}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReply),
    }).catch(console.error);
    return [...existingReplies, newReply];
};

