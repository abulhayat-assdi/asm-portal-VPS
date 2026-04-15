import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ActivityLog {
    id: string;
    actorUid: string;
    actorRole: "ADMIN" | "TEACHER";
    actionType: string;
    targetType: string;
    targetId: string;
    description: string;
    createdAt: Timestamp;
}

/**
 * Log an activity to Firestore
 */
export const logActivity = async (
    actorUid: string,
    actorRole: "ADMIN" | "TEACHER",
    actionType: string,
    targetType: string,
    targetId: string,
    description: string
) => {
    try {
        await addDoc(collection(db, "activity_logs"), {
            actorUid,
            actorRole,
            actionType,
            targetType,
            targetId,
            description,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};

/**
 * Fetch Recent Activities
 */
export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    try {
        const activityColl = collection(db, "activity_logs");
        const q = query(activityColl, orderBy("createdAt", "desc"), limit(5));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ActivityLog));
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return [];
    }
};
