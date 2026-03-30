import {
    collection, getDocs, addDoc, doc, deleteDoc, query, orderBy, where, Timestamp
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

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
 * Upload a homework file to Firebase Storage
 */
export const uploadHomeworkFile = (
    file: File,
    batchName: string,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; storagePath: string; fileName: string }> => {
    return new Promise((resolve, reject) => {
        const sanitizedBatch = batchName.replace(/[^a-zA-Z0-9_]/g, "_");
        const timestamp = Date.now();
        const storagePath = `homework/${sanitizedBatch}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(Math.round(progress));
            },
            (error) => reject(error),
            async () => {
                const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ fileUrl, storagePath, fileName: file.name });
            }
        );
    });
};

/**
 * Submit a homework entry to Firestore
 */
export const submitHomework = async (
    data: Omit<HomeworkSubmission, "id" | "submittedAt">
): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, HOMEWORK_COLLECTION), {
            ...data,
            submittedAt: Timestamp.now(),
        });
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
 * Delete a single homework submission (Firestore doc + Storage file)
 */
export const deleteHomework = async (id: string, storagePath?: string): Promise<void> => {
    try {
        // Delete file from Storage if it exists
        if (storagePath) {
            try {
                await deleteObject(ref(storage, storagePath));
            } catch (err) {
                console.warn("Storage file may not exist:", err);
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
                        await deleteObject(ref(storage, data.storagePath));
                    } catch (err) {
                        console.warn(`Failed to delete storage file: ${data.storagePath}`, err);
                    }
                }
                await deleteDoc(doc(db, HOMEWORK_COLLECTION, docSnap.id));
            });

            await Promise.all(deletePromises);
            totalDeleted += snapshot.docs.length;
            console.log(`🗑️ Cleaned up ${snapshot.docs.length} homework submissions for batch: ${batch.batchName}`);
        } catch (error) {
            console.error(`Error cleaning up homework for batch ${batch.batchName}:`, error);
        }
    }

    return totalDeleted;
};
