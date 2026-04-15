import {
    collection,
    getCountFromServer,
    query,
    where,
    getDocs,
    getDoc, // Added getDoc
    doc,
    writeBatch,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as activityService from "./activityService";

// --- Types ---

export interface AdminStats {
    totalUsers: number; // Actually counts teachers
    totalNotices: number;
    totalResources: number;
    totalFeedback: number; // Renamed from totalMessages
    pendingFeedback: number;
    pendingClasses: number;
}

// Re-export ActivityLog type
export type ActivityLog = activityService.ActivityLog;

export interface ClassSession {
    id: string;
    teacherUid: string;
    teacherName: string;
    date: string;
    startTime: string;
    endTime: string;
    timeRange?: string; // Optional full time range string
    batch: string;
    subject: string;
    status: "PENDING" | "REQUEST_TO_COMPLETE" | "COMPLETED" | "UPCOMING";
}

// --- Stats Service ---

export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        // Teachers Count (used as Total Users)
        const teachersColl = collection(db, "teachers");
        const teachersSnapshot = await getCountFromServer(teachersColl);

        // Notices Count
        const noticesColl = collection(db, "notices");
        const noticesSnapshot = await getCountFromServer(noticesColl);

        // Resources Count
        const resourcesColl = collection(db, "resources");
        const resSnapshot = await getCountFromServer(resourcesColl);

        // Feedback Counts
        const feedbackColl = collection(db, "feedback");
        const feedbackSnapshot = await getCountFromServer(feedbackColl);

        const pendingFeedbackQuery = query(feedbackColl, where("status", "==", "PENDING"));
        const pendingFeedbackSnapshot = await getCountFromServer(pendingFeedbackQuery);

        // Pending Classes Count (PENDING or REQUEST_TO_COMPLETE)
        const classesColl = collection(db, "classes");
        const pendingClassesQuery = query(
            classesColl,
            where("status", "in", ["PENDING", "REQUEST_TO_COMPLETE"])
        );
        const pendingClassesSnapshot = await getCountFromServer(pendingClassesQuery);

        return {
            totalUsers: teachersSnapshot.data().count, // Teachers count
            totalNotices: noticesSnapshot.data().count,
            totalResources: resSnapshot.data().count,
            totalFeedback: feedbackSnapshot.data().count, // Renamed from totalMessages
            pendingFeedback: pendingFeedbackSnapshot.data().count,
            pendingClasses: pendingClassesSnapshot.data().count
        };

    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return {
            totalUsers: 0, totalNotices: 0, totalResources: 0,
            totalFeedback: 0, pendingFeedback: 0, pendingClasses: 0
        };
    }
};

// --- Activity Logs ServiceWrapper ---

// Delegate to activityService
export const getRecentActivity = activityService.getRecentActivity;
export const logActivity = activityService.logActivity;

// --- Pending Classes Service ---

export const getPendingClasses = async (): Promise<ClassSession[]> => {
    try {
        const classesColl = collection(db, "classes");
        // Get both PENDING and REQUEST_TO_COMPLETE
        // Removed orderBy("date", "asc") to avoid creating a composite index manually
        const q = query(
            classesColl,
            where("status", "in", ["PENDING", "REQUEST_TO_COMPLETE"])
        );
        const snapshot = await getDocs(q);

        const classes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ClassSession));

        // Sort in client-side
        return classes.sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            return 0; // if same date, maybe sort by time? valid for now.
        });
    } catch (error) {
        console.error("Error fetching pending classes:", error);
        return [];
    }
};

export const markClassComplete = async (classId: string, adminUid: string) => {
    try {
        const batch = writeBatch(db);

        // 1. Fetch Class Data First to get details for Sheet Sync
        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
            throw new Error("Class not found");
        }

        const classData = { id: classSnap.id, ...classSnap.data() } as ClassSession;

        // 2. Update Class Status in Firestore
        batch.update(classRef, {
            status: "COMPLETED",
            completedByUid: adminUid,
            completedAt: serverTimestamp()
        });

        // 3. Add Activity Log
        const logRef = doc(collection(db, "activity_logs"));
        batch.set(logRef, {
            actorUid: adminUid,
            actorRole: "ADMIN",
            actionType: "CLASS_COMPLETED",
            targetType: "class",
            targetId: classId,
            description: `Admin marked class '${classData.subject}' for '${classData.batch}' on '${classData.date}' as completed`,
            createdAt: serverTimestamp()
        });

        await batch.commit();

        // 4. Call external API to update Google Sheets (Sync)
        // DISABLED for Free Plan (Static Hosting) - No API Routes available
        /*
        try {
            const payload = {
                teacherId: classData.teacherUid,
                date: classData.date,
                time: classData.timeRange || classData.startTime,
                status: "Completed"
            };



            const response = await fetch('/api/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.warn("Sheet Sync Warning:", errorData.error || response.statusText);
            }
        } catch (syncError) {
            console.warn("Sheet Sync Failed (Network/Other):", syncError);
        }
        */

        return true;
    } catch (error) {
        console.error("Error marking class complete:", error);
        throw error;
    }
};

// --- Database Setup Service ---
