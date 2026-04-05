import {
    collection, getDocs, addDoc, doc, deleteDoc, query, orderBy, where, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface HomeworkSubmission {
    id: string;
    studentUid: string;
    studentName: string;
    studentRoll: string;
    studentBatchName: string;
    teacherName: string;
    subject: string;
    fileUrl?: string;
    storagePath?: string;
    fileName?: string;
    textContent?: string;
    submittedAt: any;
    submissionDate: string; // "30 Mar 26" format
}

const HOMEWORK_COLLECTION = "homework_submissions";

/**
 * Format date as "30 Mar 26"
 */
export const formatHomeworkDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleString("en", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
};

/**
 * Upload a homework file to local storage via API
 */
export const uploadHomeworkFile = (
    file: File,
    batchName: string,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; storagePath: string; fileName: string }> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "homework");
        formData.append("path", batchName.replace(/[^a-zA-Z0-9_]/g, "_"));

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const percentComplete = (event.loaded / event.total) * 100;
                onProgress(Math.round(percentComplete));
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve({
                        fileUrl: response.fileUrl,
                        storagePath: response.storagePath,
                        fileName: response.fileName
                    });
                } catch (err) {
                    reject(new Error("Failed to parse upload response"));
                }
            } else {
                reject(new Error(xhr.responseText || "Upload failed"));
            }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.open("POST", "/api/storage/upload");
        xhr.send(formData);
    });
};

/**
 * Submit a homework entry to Firestore
 */
export const submitHomework = async (
    data: Omit<HomeworkSubmission, "id" | "submittedAt">
): Promise<string> => {
    try {
        const payload: any = {
            ...data,
            submittedAt: Timestamp.now(),
        };

        // Remove undefined fields to prevent Firestore errors
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        const docRef = await addDoc(collection(db, HOMEWORK_COLLECTION), payload);
        return docRef.id;
    } catch (error) {
        console.error("Error submitting homework:", error);
        throw error;
    }
};

/**
 * Fetch homework for a specific teacher
 */
export const getHomeworkByTeacher = async (teacherName: string): Promise<HomeworkSubmission[]> => {
    try {
        const q = query(
            collection(db, HOMEWORK_COLLECTION),
            where("teacherName", "==", teacherName)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as HomeworkSubmission));
        
        // Sort manually by submittedAt descending to avoid needing a Firestore composite index
        return docs.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis());
    } catch (error) {
        console.error("Error fetching homework by teacher:", error);
        return [];
    }
};

/**
 * Fetch homework for a specific student
 */
export const getHomeworkByStudent = async (studentUid: string): Promise<HomeworkSubmission[]> => {
    try {
        const q = query(
            collection(db, HOMEWORK_COLLECTION),
            where("studentUid", "==", studentUid)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as HomeworkSubmission));
        
        // Sort manually by submittedAt descending to avoid needing a Firestore composite index
        return docs.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis());
    } catch (error) {
        console.error("Error fetching homework by student:", error);
        return [];
    }
};

/**
 * Fetch all homework submissions (admin)
 */
export const getAllHomework = async (): Promise<HomeworkSubmission[]> => {
    try {
        const q = query(
            collection(db, HOMEWORK_COLLECTION),
            orderBy("submittedAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as HomeworkSubmission));
    } catch (error) {
        console.error("Error fetching all homework:", error);
        return [];
    }
};

/**
 * Delete a single homework submission (Firestore doc + local file)
 */
export const deleteHomework = async (id: string, storagePath?: string): Promise<void> => {
    try {
        // Delete file from local storage via API if it exists
        if (storagePath) {
            try {
                await fetch(`/api/storage/delete?path=${encodeURIComponent(storagePath)}`, { 
                    method: "DELETE" 
                });
            } catch (err) {
                console.warn("Storage deletion failed:", err);
            }
        }
        // Delete Firestore document
        await deleteDoc(doc(db, HOMEWORK_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting homework:", error);
        throw error;
    }
};

/**
 * Auto-cleanup: Delete all homework for batches that have been completed for 3+ days.
 * This runs on teacher/admin dashboard load.
 *
 * @param completedBatches - Array of { batchName, completedAt (Date) }
 */
export const cleanupCompletedBatchHomework = async (
    completedBatches: { batchName: string; completedAt: Date }[]
): Promise<number> => {
    const now = new Date();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    let totalDeleted = 0;

    for (const batch of completedBatches) {
        const elapsed = now.getTime() - batch.completedAt.getTime();
        if (elapsed < THREE_DAYS_MS) continue; // Not yet 3 days

        try {
            // Find all homework for this batch
            const q = query(
                collection(db, HOMEWORK_COLLECTION),
                where("studentBatchName", "==", batch.batchName)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) continue;

            // Delete each homework document + its storage file
            const deletePromises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                if (data.storagePath) {
                    try {
                        await fetch(`/api/storage/delete?path=${encodeURIComponent(data.storagePath)}`, { 
                            method: "DELETE" 
                        });
                    } catch (err) {
                        console.warn(`Failed to delete local file: ${data.storagePath}`, err);
                    }
                }
                await deleteDoc(doc(db, HOMEWORK_COLLECTION, docSnap.id));
            });

            await Promise.all(deletePromises);
            totalDeleted += snapshot.docs.length;

        } catch (error) {
            console.error(`Error cleaning up homework for batch ${batch.batchName}:`, error);
        }
    }

    return totalDeleted;
};
