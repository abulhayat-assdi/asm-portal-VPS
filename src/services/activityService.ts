// ============================================================
// activityService — All Firestore calls replaced with API calls
// ============================================================

export interface ActivityLog {
    id: string;
    actorUid: string;
    actorRole: "ADMIN" | "TEACHER";
    actionType: string;
    targetType: string;
    targetId: string;
    description: string;
    createdAt: string | Date;
}

export const logActivity = async (
    actorUid: string,
    actorRole: "ADMIN" | "TEACHER",
    actionType: string,
    targetType: string,
    targetId: string,
    description: string
): Promise<void> => {
    try {
        await fetch("/api/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ actorUid, actorRole, actionType, targetType, targetId, description }),
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};

export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    try {
        const res = await fetch("/api/activity?limit=5", { cache: "no-store" });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return [];
    }
};
