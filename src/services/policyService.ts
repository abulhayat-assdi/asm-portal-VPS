import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Policy {
    id: string;
    title: string;
    date: string; // Display date string
    version: string;
    fileUrl: string;
    sortOrder: number;
    createdAt?: any;
}

export interface MeetingMinute {
    id: string;
    title: string;
    date: string; // Display date string
    meetingNumber: string;
    fileUrl: string;
    sortOrder: number;
    createdAt?: any;
}

/**
 * Fetch all policies from Firestore, sorted by sortOrder then createdAt
 */
export const getAllPolicies = async (): Promise<Policy[]> => {
    try {
        const policiesRef = collection(db, "policies");
        const q = query(policiesRef, orderBy("sortOrder", "asc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                version: data.version,
                fileUrl: data.fileUrl,
                sortOrder: data.sortOrder ?? 999,
                createdAt: data.createdAt,
                date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            } as Policy;
        });
    } catch (error) {
        console.error("Error fetching policies:", error);
        return [];
    }
};

/**
 * Fetch all meeting minutes from Firestore, sorted by sortOrder
 */
export const getAllMeetingMinutes = async (): Promise<MeetingMinute[]> => {
    try {
        const meetingsRef = collection(db, "meeting_minutes");
        const q = query(meetingsRef, orderBy("sortOrder", "asc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                meetingNumber: data.meetingNumber,
                fileUrl: data.fileUrl,
                sortOrder: data.sortOrder ?? 999,
                createdAt: data.createdAt,
                date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            } as MeetingMinute;
        });
    } catch (error) {
        console.error("Error fetching meeting minutes:", error);
        return [];
    }
};

/**
 * Add a new policy
 */
export const addPolicy = async (data: {
    title: string;
    version: string;
    fileUrl: string;
    sortOrder: number;
}): Promise<string> => {
    try {
        const policiesRef = collection(db, "policies");
        const docRef = await addDoc(policiesRef, {
            title: data.title,
            version: data.version,
            fileUrl: data.fileUrl,
            sortOrder: data.sortOrder,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding policy:", error);
        throw error;
    }
};

/**
 * Add a new meeting minute
 */
export const addMeetingMinute = async (data: {
    title: string;
    meetingNumber: string;
    fileUrl: string;
    sortOrder: number;
}): Promise<string> => {
    try {
        const meetingsRef = collection(db, "meeting_minutes");
        const docRef = await addDoc(meetingsRef, {
            title: data.title,
            meetingNumber: data.meetingNumber,
            fileUrl: data.fileUrl,
            sortOrder: data.sortOrder,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding meeting minute:", error);
        throw error;
    }
};

/**
 * Update a policy
 */
export const updatePolicy = async (
    id: string,
    data: Partial<Omit<Policy, "id" | "createdAt" | "date">>
): Promise<void> => {
    try {
        const policyRef = doc(db, "policies", id);
        const updateData: any = { ...data };
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        await updateDoc(policyRef, updateData);
    } catch (error) {
        console.error("Error updating policy:", error);
        throw error;
    }
};

/**
 * Delete a policy
 */
export const deletePolicy = async (id: string): Promise<void> => {
    try {
        const policyRef = doc(db, "policies", id);
        await deleteDoc(policyRef);
    } catch (error) {
        console.error("Error deleting policy:", error);
        throw error;
    }
};

/**
 * Update a meeting minute
 */
export const updateMeetingMinute = async (
    id: string,
    data: Partial<Omit<MeetingMinute, "id" | "createdAt" | "date">>
): Promise<void> => {
    try {
        const meetingRef = doc(db, "meeting_minutes", id);
        const updateData: any = { ...data };
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        await updateDoc(meetingRef, updateData);
    } catch (error) {
        console.error("Error updating meeting minute:", error);
        throw error;
    }
};

/**
 * Delete a meeting minute
 */
export const deleteMeetingMinute = async (id: string): Promise<void> => {
    try {
        const meetingRef = doc(db, "meeting_minutes", id);
        await deleteDoc(meetingRef);
    } catch (error) {
        console.error("Error deleting meeting minute:", error);
        throw error;
    }
};
