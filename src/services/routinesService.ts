// ============================================================
// routinesService — All Firestore calls replaced with API calls
// ============================================================

export interface ClassRoutine {
    id: string;
    title: string;
    batch?: string;
    date: string;
    fileUrl: string;
    uploadedByUid: string;
    uploadedByName: string;
    createdAt: string | Date;
}

export const getClassRoutines = async (): Promise<ClassRoutine[]> => {
    try {
        const res = await fetch("/api/routines", { cache: "no-store" });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
};

export const addClassRoutine = async (routine: Omit<ClassRoutine, "id" | "createdAt">): Promise<string> => {
    const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routine),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add routine.");
    return data.id;
};

export const updateClassRoutine = async (id: string, updates: Partial<Omit<ClassRoutine, "id" | "createdAt">>): Promise<void> => {
    const res = await fetch("/api/routines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error("Failed to update routine.");
};

export const deleteClassRoutine = async (id: string): Promise<void> => {
    const res = await fetch(`/api/routines?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete routine.");
};
