import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp,
    query,
    orderBy,
    where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ──────────────────────────────────────────
// Video Stories
// ──────────────────────────────────────────

export interface VideoStory {
    id: string;
    youtubeUrl: string;
    videoId: string;        // extracted from URL
    title: string;
    label: string;          // e.g. "Career Placement"
    studentName: string;
    batch: string;          // e.g. "Batch 05"
    order: number;
    createdAt: any;
    updatedAt?: any;
}

const VIDEOS_COLLECTION = 'successVideos';

/** Extract YouTube video ID from various URL formats */
export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,  // raw ID
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export const getVideos = async (): Promise<VideoStory[]> => {
    try {
        const q = query(collection(db, VIDEOS_COLLECTION), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            } as VideoStory;
        });
    } catch (error) {
        console.error("Error fetching videos:", error);
        throw error;
    }
};

export const createVideo = async (video: Omit<VideoStory, 'id' | 'createdAt' | 'videoId'>): Promise<VideoStory> => {
    const videoId = extractVideoId(video.youtubeUrl);
    if (!videoId) throw new Error("Invalid YouTube URL");

    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
        ...video,
        videoId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...video, videoId, createdAt: new Date().toISOString() } as VideoStory;
};

export const updateVideo = async (id: string, updates: Partial<VideoStory>): Promise<void> => {
    // Re-extract videoId if URL changed
    if (updates.youtubeUrl) {
        const videoId = extractVideoId(updates.youtubeUrl);
        if (!videoId) throw new Error("Invalid YouTube URL");
        updates.videoId = videoId;
    }
    const docRef = doc(db, VIDEOS_COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteVideo = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, VIDEOS_COLLECTION, id));
};


// ──────────────────────────────────────────
// Written Reviews
// ──────────────────────────────────────────

export interface WrittenReview {
    id: string;
    studentName: string;
    batch: string;
    role: string;
    company: string;
    quote: string;
    rating: number;          // 1-5
    order: number;
    createdAt: any;
    updatedAt?: any;
}

const REVIEWS_COLLECTION = 'successReviews';

export const getReviews = async (): Promise<WrittenReview[]> => {
    try {
        // Fetch original admin-added reviews
        const q = query(collection(db, REVIEWS_COLLECTION), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        const oldReviews = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            } as WrittenReview;
        });

        // Fetch student-submitted feedback that has been approved
        const feedbackQ = query(collection(db, "feedback"), where("status", "==", "APPROVED"));
        const feedbackSnap = await getDocs(feedbackQ);
        const newReviews = feedbackSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                studentName: data.studentName || "Anonymous",
                batch: data.batch || "",
                role: data.role || "",
                company: data.company || "",
                quote: data.message || "",
                rating: data.rating || 5,
                order: 0, // default order for student reviews
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                updatedAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
            } as WrittenReview;
        });

        // Combine and sort
        const combined = [...oldReviews, ...newReviews].sort((a, b) => {
            // Sort by order first, then by date descending
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return combined;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        throw error;
    }
};

export const createReview = async (review: Omit<WrittenReview, 'id' | 'createdAt'>): Promise<WrittenReview> => {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
        ...review,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...review, createdAt: new Date().toISOString() } as WrittenReview;
};

export const updateReview = async (id: string, updates: Partial<WrittenReview>): Promise<void> => {
    const docRef = doc(db, REVIEWS_COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteReview = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, id));
};
