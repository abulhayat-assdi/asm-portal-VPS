// ============================================================
// homeVideoTestimonialService — All Firestore calls replaced with API calls
// ============================================================

export interface HomeVideoTestimonial {
    id: string;
    youtubeUrl: string;
    videoId: string;
    title: string;
    studentName?: string;
    order: number;
    createdAt?: string;
    updatedAt?: string;
}

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

export const getVideos = async (): Promise<HomeVideoTestimonial[]> => {
    const res = await fetch("/api/testimonials", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const createVideo = async (video: Omit<HomeVideoTestimonial, "id" | "createdAt" | "videoId">): Promise<HomeVideoTestimonial> => {
    const videoId = extractVideoId(video.youtubeUrl);
    if (!videoId) throw new Error("Invalid YouTube URL");
    const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...video, videoId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create testimonial.");
    return data;
};

export const updateVideo = async (id: string, updates: Partial<HomeVideoTestimonial>): Promise<void> => {
    if (updates.youtubeUrl) {
        const videoId = extractVideoId(updates.youtubeUrl);
        if (!videoId) throw new Error("Invalid YouTube URL");
        updates.videoId = videoId;
    }
    const res = await fetch("/api/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error("Failed to update testimonial.");
};

export const deleteVideo = async (id: string): Promise<void> => {
    const res = await fetch(`/api/testimonials?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete testimonial.");
};
