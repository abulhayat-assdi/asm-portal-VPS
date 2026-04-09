import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ContactMessage {
    id: string;
    subject: string;
    message: string;
    studentUid: string;
    studentName: string;
    studentEmail: string;
    studentBatchName: string;
    studentRoll: string;
    status: "unread" | "read" | "resolved";
    createdAt: any;
    date: string;
    adminReply?: string;
}

/**
 * Submit a contact message from a student
 */
export const submitContactMessage = async (
    data: Omit<ContactMessage, "id">
): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, "contact_messages"), data);
        return docRef.id;
    } catch (error) {
        console.error("Error submitting contact message:", error);
        throw error;
    }
};

/**
 * Fetch all contact messages (admin only)
 */
export const getAllContactMessages = async (): Promise<ContactMessage[]> => {
    try {
        const q = query(collection(db, "contact_messages"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
    } catch (error) {
        console.error("Error fetching contact messages:", error);
        return [];
    }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (id: string): Promise<void> => {
    try {
        await updateDoc(doc(db, "contact_messages", id), { status: "read" });
    } catch (error) {
        console.error("Error marking message as read:", error);
        throw error;
    }
};

/**
 * Mark a message as resolved
 */
export const markMessageAsResolved = async (id: string): Promise<void> => {
    try {
        await updateDoc(doc(db, "contact_messages", id), { status: "resolved" });
    } catch (error) {
        console.error("Error marking message as resolved:", error);
        throw error;
    }
};

/**
 * Delete a contact message
 */
export const deleteContactMessage = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "contact_messages", id));
    } catch (error) {
        console.error("Error deleting contact message:", error);
        throw error;
    }
};
