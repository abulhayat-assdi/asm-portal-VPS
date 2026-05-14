// ============================================================
// resultService — All Firestore calls replaced with API calls
// ============================================================

export interface CustomColumn {
    id: string;
    label: string;
}

export interface ExamRecord {
    id: string;
    examName: string;
    subjects: Record<string, string>;
}

export interface ExamResult {
    id: string;
    batchName: string;
    roll: string;
    name: string;
    customColumns?: CustomColumn[];
    examRecords?: ExamRecord[];
    marks?: number | string;
    remarks?: string;
    updatedAt?: string;
}

export const createDefaultExamRecord = (examName = ""): ExamRecord => ({
    id: Math.random().toString(36).substring(2, 9),
    examName,
    subjects: {
        sales: "", service: "", careerPlanning: "", ai: "",
        metaMarketing: "", msOffice: "", landingPage: ""
    },
});

export const saveBatchResults = async (batchName: string, results: Omit<ExamResult, "id">[]): Promise<void> => {
    const res = await fetch("/api/results/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName, results }),
    });
    if (!res.ok) throw new Error("Failed to save batch results.");
};

export const saveSingleResult = async (result: ExamResult): Promise<void> => {
    const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
    });
    if (!res.ok) throw new Error("Failed to save result.");
};

export const getAllExamResults = async (): Promise<ExamResult[]> => {
    const res = await fetch("/api/results?all=true", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getStudentResult = async (batchName: string, roll: string): Promise<ExamResult | null> => {
    const res = await fetch(`/api/results?batchName=${encodeURIComponent(batchName)}&roll=${encodeURIComponent(roll)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
};
