import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
    onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logActivity } from "./activityService";

export interface Feedback {
    id: string;
    studentName: string;
    batch: string; // Changed from batchName to match Firestore schema
    role: string;
    company: string;
    message: string;
    rating: number;
    status: "APPROVED" | "PENDING"; // Uppercase as per requirement
    createdAt: Timestamp; // Using Firestore Timestamp
    submittedFrom: string;
    approvedByUid?: string | null;
}

// Collection reference
const feedbackCollection = collection(db, "feedback");

/**
 * Fetch feedback. Admins get all (ordered by date), Teachers get only APPROVED.
 */
export const getFeedbackList = async (isAdmin: boolean = false): Promise<Feedback[]> => {
    try {
        let q;
        if (isAdmin) {
            q = query(feedbackCollection, orderBy("createdAt", "desc"));
        } else {
            q = query(feedbackCollection, where("status", "==", "APPROVED"));
        }

        const snapshot = await getDocs(q);

        const feedbacks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Feedback));

        if (!isAdmin) {
            // Sort client-side to avoid requiring a composite index in Firestore
            return feedbacks.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });
        }

        return feedbacks;
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return [];
    }
};

/**
 * Approve feedback (Admin Only)
 */
export const approveFeedback = async (id: string, adminUid: string) => {
    try {
        const feedbackRef = doc(db, "feedback", id);
        await updateDoc(feedbackRef, {
            status: "APPROVED",
            approvedByUid: adminUid
        });

        // Log Activity
        await logActivity(
            adminUid,
            "ADMIN",
            "FEEDBACK_APPROVED",
            "feedback",
            id,
            "Admin approved a student feedback"
        );

        return true;
    } catch (error) {
        console.error("Error approving feedback:", error);
        throw error;
    }
};

/**
 * Delete feedback (Admin Only)
 */
export const deleteFeedback = async (id: string, adminUid: string) => {
    try {
        const feedbackRef = doc(db, "feedback", id);
        await deleteDoc(feedbackRef);

        // Log Activity (best-effort, don't fail delete if logging fails)
        logActivity(
            adminUid,
            "ADMIN",
            "FEEDBACK_DELETED",
            "feedback",
            id,
            "Admin deleted a student feedback"
        ).catch((err) => console.warn("Activity log failed (non-critical):", err));

        return true;
    } catch (error) {
        console.error("Error deleting feedback:", error);
        throw error;
    }
};

/**
 * Submit new feedback from public form (Status: PENDING)
 */
export const submitFeedback = async (
    studentName: string,
    batch: string,
    role: string,
    company: string,
    message: string,
    rating: number
): Promise<boolean> => {
    try {
        await addDoc(feedbackCollection, {
            studentName,
            batch,
            role,
            company,
            message,
            rating,
            status: "PENDING",
            createdAt: serverTimestamp(),
            submittedFrom: "PUBLIC_FORM",
            approvedByUid: null
        });
        return true;
    } catch (error) {
        console.error("Error submitting feedback:", error);
        throw error;
    }
};

/**
 * Get only PENDING feedback (for Admin Panel) - one-time fetch
 */
export const getPendingFeedback = async (): Promise<Feedback[]> => {
    try {
        // Only filter by status, sort client-side to avoid composite index requirement
        const q = query(
            feedbackCollection,
            where("status", "==", "PENDING")
        );
        const snapshot = await getDocs(q);

        const feedbacks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Feedback));

        // Sort by createdAt descending client-side
        return feedbacks.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
    } catch (error) {
        console.error("Error fetching pending feedback:", error);
        return [];
    }
};

/**
 * REAL-TIME: Subscribe to pending feedback updates
 * Returns an unsubscribe function to stop listening
 */
export const subscribeToPendingFeedback = (
    callback: (feedbacks: Feedback[]) => void
): (() => void) => {
    const q = query(
        feedbackCollection,
        where("status", "==", "PENDING")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const feedbacks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Feedback));

        // Sort by createdAt descending client-side
        const sorted = feedbacks.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

        callback(sorted);
    }, (error) => {
        console.error("Error in realtime feedback subscription:", error);
    });

    return unsubscribe;
};

