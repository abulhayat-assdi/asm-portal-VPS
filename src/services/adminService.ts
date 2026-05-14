// ============================================================
// adminService — All Firestore calls replaced with API calls
// ============================================================

import * as activityService from "./activityService";

export interface AdminStats {
    totalUsers: number;
    totalNotices: number;
    totalResources: number;
    totalFeedback: number;
    pendingFeedback: number;
    pendingClasses: number;
}

export type ActivityLog = activityService.ActivityLog;

export interface ClassSession {
    id: string;
    teacherUid: string;
    teacherName: string;
    date: string;
    startTime: string;
    endTime: string;
    timeRange?: string;
    batch: string;
    subject: string;
    status: "PENDING" | "REQUEST_TO_COMPLETE" | "COMPLETED" | "UPCOMING";
}

export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) throw new Error();
        return res.json();
    } catch {
        return { totalUsers: 0, totalNotices: 0, totalResources: 0, totalFeedback: 0, pendingFeedback: 0, pendingClasses: 0 };
    }
};

export const getRecentActivity = activityService.getRecentActivity;
export const logActivity = activityService.logActivity;

export const getPendingClasses = async (): Promise<ClassSession[]> => {
    try {
        const res = await fetch("/api/admin/pending-classes", { cache: "no-store" });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
};

export const markClassComplete = async (classId: string, adminUid: string, clsData?: any): Promise<boolean> => {
    const res = await fetch("/api/admin/mark-class-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, adminUid, clsData }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark class as complete.");
    }
    return true;
};
