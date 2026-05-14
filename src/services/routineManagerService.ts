// ============================================================
// routineManagerService — All Firestore calls replaced with API calls
// ============================================================

export interface BatchRoutineEntry {
    id?: string;
    batch: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacherName: string;
    room: string;
}

export const getRoutinesByBatch = async (batchName: string): Promise<BatchRoutineEntry[]> => {
    try {
        const res = await fetch(`/api/routine-manager?batch=${encodeURIComponent(batchName)}`, { cache: "no-store" });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
};

/**
 * Full replace of batch routines — deletes old, inserts new.
 */
export const syncBatchRoutines = async (batchName: string, routines: BatchRoutineEntry[]): Promise<void> => {
    const res = await fetch("/api/routine-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName, routines }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync routines.");
    }
};
