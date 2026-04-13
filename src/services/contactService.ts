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

// ============================================================================
// NEW REAL-TIME CHAT SYSTEM
// ============================================================================

import { onSnapshot, setDoc, writeBatch, Timestamp, serverTimestamp } from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { storage } from "@/lib/firebase"; // Ensure storage is exported from firebase.ts

export interface ChatAttachment {
    url: string;
    name: string;
    path: string; // Required for deleting from storage
    size: number;
    type: string;
}

export interface ChatMessage {
    id: string;
    sender: "student" | "admin";
    text: string;
    attachments: ChatAttachment[];
    createdAt: any;
}

export interface AdminChatThread {
    studentUid: string;
    studentName: string;
    studentEmail: string;
    studentBatchName: string;
    studentRoll: string;
    lastMessageText: string;
    lastMessageTime: any;
    unreadCountAdmin: number;
    unreadCountStudent: number;
}

/**
 * Send a message (student or admin)
 */
export const sendChatMessage = async (
    studentUid: string,
    sender: "student" | "admin",
    text: string,
    attachments: ChatAttachment[],
    studentProfileInfo?: { name: string, email: string, batch: string, roll: string }
) => {
    try {
        const threadRef = doc(db, "admin_chats", studentUid);
        const messagesRef = collection(db, "admin_chats", studentUid, "messages");

        let lastMessageText = text.trim() || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : "");

        const messageObj = {
            sender,
            text,
            attachments,
            createdAt: Timestamp.now()
        };

        const updateObj: any = {
            lastMessageText,
            lastMessageTime: Timestamp.now()
        };

        if (sender === "student") {
            updateObj.unreadCountAdmin = 1; // Increment ideally, but for simplicity set to 1 or you can use FieldValue.increment(1). But setting to 1 makes it simpler if we just treat any > 0 as unread. Let's use 1 to mark it unread.
            // Actually, we should just mark unread=true. But we used unreadCountAdmin: number.
            updateObj.unreadCountStudent = 0;
            // Provide profile info on creation if it doesn't exist
            if (studentProfileInfo) {
                updateObj.studentName = studentProfileInfo.name;
                updateObj.studentEmail = studentProfileInfo.email;
                updateObj.studentBatchName = studentProfileInfo.batch;
                updateObj.studentRoll = studentProfileInfo.roll;
            }
        } else {
            updateObj.unreadCountStudent = 1;
            updateObj.unreadCountAdmin = 0;
        }

        const messageDocRef = doc(messagesRef);
        
        // Execute sequentially instead of batch to bypass Firebase internal assertion caching bug
        await setDoc(threadRef, updateObj, { merge: true });
        await setDoc(messageDocRef, messageObj);
    } catch (err) {
        console.error("Error sending chat message:", err);
        throw err;
    }
}

/**
 * Subscribe to all chat threads (Admin)
 */
export const subscribeToAllChatThreads = (callback: (threads: AdminChatThread[]) => void) => {
    const q = query(collection(db, "admin_chats"), orderBy("lastMessageTime", "desc"));
    return onSnapshot(q, (snapshot) => {
        const threads = snapshot.docs.map(doc => ({
            studentUid: doc.id,
            ...doc.data()
        } as AdminChatThread));
        callback(threads);
    });
}

/**
 * Subscribe to single chat messages
 */
export const subscribeToChatMessages = (studentUid: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(collection(db, "admin_chats", studentUid, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatMessage));
        callback(msgs);
    });
}

/**
 * Mark thread as read for role
 */
export const markChatAsRead = async (studentUid: string, role: "student" | "admin") => {
    try {
        const threadRef = doc(db, "admin_chats", studentUid);
        if (role === "admin") {
            await updateDoc(threadRef, { unreadCountAdmin: 0 });
        } else {
            await updateDoc(threadRef, { unreadCountStudent: 0 });
        }
    } catch (err) {
        console.error("Error marking chat as read:", err);
    }
}

/**
 * Fully delete a discussion thread and ALL its storage attachments
 */
export const deleteChatThread = async (studentUid: string): Promise<void> => {
    try {
        // 1. Delete all files out of storage for this user's context
        const storageFolderRef = ref(storage, `chat_files/${studentUid}/`);
        try {
            const fileList = await listAll(storageFolderRef);
            const deletePromises = fileList.items.map(itemRef => deleteObject(itemRef));
            await Promise.all(deletePromises);
        } catch (storageErr) {
            console.warn("Storage deletion warning (might be empty):", storageErr);
        }

        // 2. Erase all firestore message documents
        const messagesCol = collection(db, "admin_chats", studentUid, "messages");
        const snapshot = await getDocs(messagesCol);
        
        // Use batch deletion
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        // 3. Delete parent chat thread structure
        batch.delete(doc(db, "admin_chats", studentUid));

        await batch.commit();

    } catch (err) {
        console.error("Failed executing massive thread deletion:", err);
        throw err;
    }
}
