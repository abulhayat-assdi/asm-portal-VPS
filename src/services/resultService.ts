import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

export interface ExamResult {
    id: string; // generated ID
    batchName: string;
    roll: string;
    name: string;
    marks: number | string;
    remarks: string;
    updatedAt?: Date;
}

const EXAM_RESULTS_COLLECTION = "exam_results";

/**
 * Saves or updates results for an entire batch.
 */
export const saveBatchResults = async (batchName: string, results: Omit<ExamResult, "id">[]): Promise<void> => {
    const savePromises = results.map(async (result) => {
        const docId = `${batchName.replace(/\s+/g, '_')}_${result.roll}`;
        const docRef = doc(db, EXAM_RESULTS_COLLECTION, docId);
        
        return setDoc(docRef, {
            ...result,
            id: docId,
            batchName,
            updatedAt: Timestamp.now()
        }, { merge: true });
    });

    await Promise.all(savePromises);
};

/**
 * Retrieves all exam results across all batches.
 */
export const getAllExamResults = async (): Promise<ExamResult[]> => {
    const q = query(collection(db, EXAM_RESULTS_COLLECTION), orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            updatedAt: data.updatedAt?.toDate()
        } as ExamResult;
    });
};

/**
 * Retrieve specific student's result
 */
export const getStudentResult = async (batchName: string, roll: string): Promise<ExamResult | null> => {
    try {
        const docId = `${batchName.replace(/\s+/g, '_')}_${roll}`;
        const q = query(collection(db, EXAM_RESULTS_COLLECTION));
        const snapshot = await getDocs(q);
        
        const resultDoc = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.batchName === batchName && data.roll === roll;
        });

        if (resultDoc) {
            const data = resultDoc.data();
            return {
                ...data,
                id: resultDoc.id,
                updatedAt: data.updatedAt?.toDate()
            } as ExamResult;
        }
        return null;
    } catch (error) {
        console.error("Error fetching single result:", error);
        return null;
    }
};
