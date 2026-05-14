/**
 * studentService — Student-related API calls
 */

export interface BatchStudent {
    id: string;
    batchId: string;
    batchName: string;
    roll: string;
    name: string;
    phone: string;
    address: string;
    educationalDegree?: string;
    courseStatus: string;
    currentlyDoing?: string;
    companyName?: string;
    businessName?: string;
    salary: number;
}

export const getStudentProfile = async (): Promise<BatchStudent | null> => {
    try {
        const res = await fetch("/api/student/profile", { cache: "no-store" });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
};
