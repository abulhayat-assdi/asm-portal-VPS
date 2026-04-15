import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
    Timestamp,
    FieldValue
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { cache } from 'react';

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
    createdAt: Timestamp | Date | FieldValue | null;
    publishedAt?: Timestamp | Date | FieldValue | null;
    updatedAt?: Timestamp | Date | FieldValue | null;
}

const COLLECTION_NAME = 'posts';

/**
 * Fetch all posts with an optional limit
 */
export const getPosts = cache(async (limitCount?: number): Promise<BlogPost[]> => {
    try {
        let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

        if (limitCount) {
            const { limit: firestoreLimit } = await import('firebase/firestore');
            q = query(q, firestoreLimit(limitCount));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                publishedAt: data.publishedAt?.toDate?.().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            } as BlogPost;
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
});

/**
 * Fetch all published posts with an optional limit
 */
export const getPublishedPosts = cache(async (limitCount?: number): Promise<BlogPost[]> => {
    try {
        let q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc')
        );

        if (limitCount) {
            const { limit: firestoreLimit } = await import('firebase/firestore');
            q = query(q, firestoreLimit(limitCount));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                publishedAt: data.publishedAt?.toDate?.().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            } as BlogPost;
        });
    } catch (error) {
        console.error("Error fetching published posts:", error);
        return [];
    }
});

/**
 * Fetch a single post by ID
 */
export const getPost = cache(async (id: string): Promise<BlogPost | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                publishedAt: data.publishedAt?.toDate?.().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            } as BlogPost;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching post:", error);
        throw error;
    }
});

/**
 * Fetch a single post by Slug
 */
export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('slug', '==', slug),
            where('status', '==', 'published'),
            // limit(1) - query might return more if slugs aren't unique, we take first
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
            publishedAt: data.publishedAt?.toDate?.().toISOString(),
            updatedAt: data.updatedAt?.toDate?.().toISOString(),
        } as BlogPost;

    } catch (error) {
        console.error("Error fetching post by slug:", error);
        throw error;
    }
});

export const createPost = async (post: Omit<BlogPost, 'id' | 'createdAt'>): Promise<BlogPost> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...post,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return {
            id: docRef.id,
            ...post,
            createdAt: new Date(), // Optimistic return
        } as BlogPost;
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
};

export const updatePost = async (id: string, updates: Partial<BlogPost>): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
};

export const deletePost = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
};

export const publishPost = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status: 'published',
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error publishing post:", error);
        throw error;
    }
};
