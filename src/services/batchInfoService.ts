// ============================================================
// batchInfoService — All Firestore calls replaced with API calls
// ============================================================

export interface BatchStudent {
    id?: string;
    batchName: string;
    roll: string;
    name: string;
    phone?: string;
    address?: string;
    dob?: string;
    educationalDegree?: string;
    category?: string;
    bloodGroup?: string;
    totalPaidTk?: string;
    courseStatus?: "Running" | "Completed" | "Incomplete" | "Expelled";
    currentlyDoing?: string;
    companyName?: string;
    businessName?: string;
    salary?: number;
    batchType?: "Running" | "Completed";
    isPublic?: boolean;
    completedAt?: string;
    createdAt?: string | Date;
}

// ─── Backward-compat aliases ─────────────────────────────────
export type StudentBatchInfo = BatchStudent;


export interface BatchInfo {
    batchName: string;
    students: BatchStudent[];
    totalStudents: number;
    activeStudents?: number;
    completedStudents?: number;
}

export const getBatchStudents = async (batchName: string): Promise<BatchStudent[]> => {
    const res = await fetch(`/api/batch-info?batchName=${encodeURIComponent(batchName)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getAllBatchStudents = async (): Promise<BatchStudent[]> => {
    const res = await fetch("/api/batch-info?all=true", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getPublicBatchStudents = async (batchName: string): Promise<BatchStudent[]> => {
    const res = await fetch(`/api/batch-info?batchName=${encodeURIComponent(batchName)}&public=true`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const addBatchStudent = async (student: Omit<BatchStudent, "id">): Promise<string> => {
    const res = await fetch("/api/batch-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add student.");
    return data.id;
};

export const updateBatchStudent = async (id: string, data: Partial<BatchStudent>): Promise<void> => {
    const res = await fetch("/api/batch-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to update student.");
    }
};

export const deleteBatchStudent = async (id: string): Promise<void> => {
    const res = await fetch(`/api/batch-info?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete student.");
};

export const importBatchStudents = async (students: Omit<BatchStudent, "id">[]): Promise<{ added: number; skipped: number }> => {
    const res = await fetch("/api/batch-info/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to import students.");
    return data;
};

export const findStudentByRoll = async (batchName: string, roll: string): Promise<BatchStudent | null> => {
    const res = await fetch(`/api/batch-info?batchName=${encodeURIComponent(batchName)}&roll=${encodeURIComponent(roll)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
};

// ─── Backward-compat aliases ─────────────────────────────────

/** Alias for getAllBatchStudents */
export const getAllBatchInfo = getAllBatchStudents;

/** Save/upsert an entire batch (bulk) */
export const saveBatchInfo = async (
    batchName: string,
    students: BatchStudent[],
    batchType: "Running" | "Completed",
    completedAt?: Date | string
): Promise<void> => {
    const res = await fetch("/api/batch-info/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName, students, batchType, completedAt }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save batch data.");
    }
};

/** Return unique batch names from all students */
export const getPublicUniqueBatches = async (): Promise<string[]> => {
    const students = await getAllBatchStudents();
    const names = new Set<string>(students.map((s) => s.batchName));
    return Array.from(names).sort();
};

