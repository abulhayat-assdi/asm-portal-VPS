// ============================================================
// scheduleService — All Firestore calls replaced with API calls
// ============================================================

export interface ClassSchedule {
    id?: string;
    teacherId: string;
    teacherName: string;
    date: string;
    day: string;
    batch: string;
    subject: string;
    time: string;
    status: "Completed" | "Scheduled" | "Upcoming" | "Pending" | "Today" | "Requested";
}

export interface BatchItem {
    id: string;
    name: string;
    status: "active" | "archived";
    createdAt: string | null;
}

export interface FirestoreClass {
    teacherUid: string;
    teacherName: string;
    date: string;
    startTime: string;
    endTime: string;
    batch: string;
    subject: string;
    status: "REQUEST_TO_COMPLETE" | "COMPLETED" | "PENDING";
    completedByUid?: string | null;
    completedAt?: string | null;
    createdAt?: string | null;
}

// Helper to normalize date string to YYYY-MM-DD
const getNormalizedDate = (dateStr: string): string => {
    if (!dateStr) return "";
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
    } catch { }
    return dateStr;
};

const getDhakaTodayDateString = (): string => {
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const getCurrentWeekRange = () => {
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const dayOfWeek = today.getDay();
    const diffToFriday = (dayOfWeek + 2) % 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diffToFriday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { start: format(startOfWeek), end: format(endOfWeek) };
};

export const getClassesByTeacherId = async (teacherId: string, teacherUid?: string, filterCurrentWeek = true): Promise<ClassSchedule[]> => {
    const params = new URLSearchParams({ teacherId });
    if (teacherUid) params.set("teacherUid", teacherUid);
    if (!filterCurrentWeek) params.set("all", "true");

    const res = await fetch(`/api/schedule?${params}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getAllClassesSchedules = async (filterCurrentWeek = true): Promise<ClassSchedule[]> => {
    const url = filterCurrentWeek ? "/api/schedule/all" : "/api/schedule/all?all=true";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const addBatchClassSchedules = async (schedules: Omit<ClassSchedule, "status">[]): Promise<boolean> => {
    const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
    });
    if (!res.ok) throw new Error("Failed to add schedules.");
    return true;
};

export const syncBatchClassSchedules = async (schedules: Partial<ClassSchedule>[]): Promise<boolean> => {
    const res = await fetch("/api/schedule/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
    });
    if (!res.ok) throw new Error("Failed to sync schedules.");
    return true;
};

export const requestClassCompletion = async (teacherId: string, teacherName: string, scheduleItem: ClassSchedule): Promise<boolean> => {
    const res = await fetch("/api/schedule/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, teacherName, scheduleItem, action: "request" }),
    });
    if (!res.ok) throw new Error("Failed to request class completion.");
    return true;
};

export const markClassAsCompleted = async (teacherId: string, teacherName: string, scheduleItem: ClassSchedule): Promise<boolean> => {
    const res = await fetch("/api/schedule/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, teacherName, scheduleItem, action: "complete" }),
    });
    if (!res.ok) throw new Error("Failed to mark class as completed.");
    return true;
};

export const getBatchClassCounts = async (): Promise<Record<string, { subjectName: string; classCount: number }[]>> => {
    const res = await fetch("/api/schedule/class-counts", { cache: "no-store" });
    if (!res.ok) return {};
    return res.json();
};

export const getBatches = async (): Promise<BatchItem[]> => {
    const res = await fetch("/api/schedule/batches", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const addBatch = async (name: string): Promise<boolean> => {
    const res = await fetch("/api/schedule/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to add batch.");
    return true;
};

export const toggleBatchStatus = async (batchId: string, currentStatus: "active" | "archived"): Promise<boolean> => {
    const res = await fetch("/api/schedule/batches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: batchId, status: currentStatus === "active" ? "archived" : "active" }),
    });
    if (!res.ok) throw new Error("Failed to toggle batch status.");
    return true;
};

export const getCompletedClassesByBatch = async (batchName: string): Promise<(FirestoreClass & { id: string })[]> => {
    const res = await fetch(`/api/schedule/completed?batch=${encodeURIComponent(batchName)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};
