// ============================================================
// successStoryService — All Firestore calls replaced with API calls
// ============================================================

// ─── Video Stories ──────────────────────────────────────────

export interface VideoStory {
    id: string;
    youtubeUrl: string;
    videoId: string;
    title: string;
    label: string;
    studentName: string;
    batch: string;
    order: number;
    createdAt: string;
    updatedAt?: string;
}

/** Extract YouTube video ID from various URL formats */
export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export const getVideos = async (): Promise<VideoStory[]> => {
    const res = await fetch("/api/success-stories/videos", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const createVideo = async (video: Omit<VideoStory, "id" | "createdAt" | "videoId">): Promise<VideoStory> => {
    const videoId = extractVideoId(video.youtubeUrl);
    if (!videoId) throw new Error("Invalid YouTube URL");
    const res = await fetch("/api/success-stories/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...video, videoId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create video story.");
    return data;
};

export const updateVideo = async (id: string, updates: Partial<VideoStory>): Promise<void> => {
    if (updates.youtubeUrl) {
        const videoId = extractVideoId(updates.youtubeUrl);
        if (!videoId) throw new Error("Invalid YouTube URL");
        updates.videoId = videoId;
    }
    const res = await fetch("/api/success-stories/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error("Failed to update video story.");
};

export const deleteVideo = async (id: string): Promise<void> => {
    const res = await fetch(`/api/success-stories/videos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete video story.");
};

// ─── Written Reviews ────────────────────────────────────────

export interface WrittenReview {
    id: string;
    studentName: string;
    batch: string;
    role: string;
    company: string;
    quote: string;
    rating: number;
    order: number;
    createdAt: string;
    updatedAt?: string;
}

export const getReviews = async (): Promise<WrittenReview[]> => {
    const res = await fetch("/api/success-stories/reviews", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const createReview = async (review: Omit<WrittenReview, "id" | "createdAt">): Promise<WrittenReview> => {
    const res = await fetch("/api/success-stories/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create review.");
    return data;
};

export const updateReview = async (id: string, updates: Partial<WrittenReview>): Promise<void> => {
    const res = await fetch("/api/success-stories/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error("Failed to update review.");
};

export const deleteReview = async (id: string): Promise<void> => {
    const res = await fetch(`/api/success-stories/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete review.");
};
