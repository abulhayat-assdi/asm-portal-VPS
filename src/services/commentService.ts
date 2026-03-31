import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    serverTimestamp,
    query,
    orderBy,
    where,
    Timestamp,
    increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COMMENTS_COLLECTION = 'blogComments';

export interface CommentReply {
    id: string;
    authorName: string;
    content: string;
    createdAt: any;
}

export interface BlogComment {
    id: string;
    blogId: string;
    authorName: string;
    content: string;
    likes: number;
    replies: CommentReply[];
    createdAt: any;
}

/**
 * Fetch all comments for a specific blog post
 */
export const getCommentsByBlogId = async (blogId: string): Promise<BlogComment[]> => {
    try {
        const q = query(
            collection(db, COMMENTS_COLLECTION),
            where('blogId', '==', blogId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamps to ISO strings for the frontend
                createdAt: data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate().toISOString()
                    : new Date().toISOString(),
                // Ensure replies also have proper string dates
                replies: (data.replies || []).map((reply: any) => ({
                    ...reply,
                    createdAt: reply.createdAt instanceof Timestamp
                        ? reply.createdAt.toDate().toISOString()
                        : (reply.createdAt || new Date().toISOString())
                }))
            } as BlogComment;
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
};

/**
 * Add a new top-level comment to a blog
 */
export const addComment = async (blogId: string, authorName: string, content: string): Promise<BlogComment> => {
    const rawComment = {
        blogId,
        authorName,
        content,
        likes: 0,
        replies: [],
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), rawComment);

    return {
        id: docRef.id,
        blogId,
        authorName,
        content,
        likes: 0,
        replies: [],
        createdAt: new Date().toISOString()
    };
};

/**
 * Increment the like count on a comment
 */
export const likeComment = async (commentId: string): Promise<void> => {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
        likes: increment(1)
    });
};

/**
 * Add a reply to an existing comment
 * We structure replies as an array embedded within the main comment document
 */
export const addReply = async (commentId: string, existingReplies: CommentReply[], authorName: string, content: string): Promise<CommentReply[]> => {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);

    const newReply: CommentReply = {
        id: crypto.randomUUID(), // Local unique ID for the reply array item
        authorName,
        content,
        createdAt: new Date().toISOString() // Storing as string in the array is simpler since it's nested
    };

    const { arrayUnion } = await import('firebase/firestore');
    await updateDoc(commentRef, {
        replies: arrayUnion(newReply)
    });

    return [...existingReplies, newReply];
};
