import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, Timestamp } from "firebase/firestore";

export interface StudentBatchInfo {
    id: string; // usually roll or a generated ID
    batchName: string;
    roll: string;
    name: string;
    phone: string;
    address: string;
    dob?: string;
    educationalDegree?: string;
    category?: "Alim" | "General" | "";
    bloodGroup?: string;
    courseStatus: "Completed" | "Running" | "Incomplete" | "Expelled" | "";
    currentlyDoing: "Job" | "Business" | "Studying Further" | "Nothing" | "";
    companyName: string;
    businessName: string;
    salary: number;
    batchType?: "Running" | "Completed"; // To distinguish current batches from completed ones
    createdAt?: Date;
    completedAt?: Date; // When the batch was marked as Completed (for homework auto-cleanup)
}

const BATCH_INFO_COLLECTION = "batch_info";
const PUBLIC_STUDENTS_COLLECTION = "public_batch_students";

export interface PublicStudentInfo {
    id: string;
    batchName: string;
    roll: string;
    name: string;
}

/**
 * Saves or updates a full batch of students.
 * For simplicity, we store each student as a document in the `batch_info` collection,
 * searchable and groupable by `batchName`.
 */
export const saveBatchInfo = async (
    batchName: string, 
    students: Omit<StudentBatchInfo, "id">[],
    batchType: "Running" | "Completed" = "Completed",
    completedAt?: Date
): Promise<void> => {
    // 1. Get all existing students for this batch to find deletions
    const q = query(collection(db, BATCH_INFO_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const existingIds = snapshot.docs
        .filter(doc => doc.data().batchName === batchName)
        .map(doc => doc.id);

    const newIds = new Set<string>();

    // 2. Save or update the incoming students
    const savePromises = students.map(async (student) => {
        // Create a unique deterministic ID based on Batch + Roll to easily update existing ones
        const docId = `${batchName.replace(/\s+/g, '_')}_${student.roll}`;
        newIds.add(docId);
        
        const docRef = doc(db, BATCH_INFO_COLLECTION, docId);
        
        // Build document data
        const docData: any = {
            ...student,
            id: docId,
            batchName,
            batchType,
            salary: Number(student.salary) || 0, // ensure salary is a number
            createdAt: Timestamp.now()
        };

        // Add completedAt if batch is being completed
        if (batchType === "Completed" && completedAt) {
            docData.completedAt = Timestamp.fromDate(completedAt);
        }

        // Save to full private collection
        const savePrivate = setDoc(docRef, docData, { merge: true });

        // Save to public collection
        const publicDocRef = doc(db, PUBLIC_STUDENTS_COLLECTION, docId);
        const savePublic = setDoc(publicDocRef, {
            id: docId,
            batchName,
            roll: student.roll,
            name: student.name,
            createdAt: Timestamp.now()
        }, { merge: true });

        return Promise.all([savePrivate, savePublic]);
    });

    await Promise.all(savePromises);

    // 3. Delete any student documents that were removed in this edit
    const deletePromises = existingIds
        .filter(id => !newIds.has(id))
        .map(id => Promise.all([
            deleteDoc(doc(db, BATCH_INFO_COLLECTION, id)),
            deleteDoc(doc(db, PUBLIC_STUDENTS_COLLECTION, id))
        ]));
        
    await Promise.all(deletePromises);
};

/**
 * Retrieves all students across all batches for aggregation.
 */
export const getAllBatchInfo = async (): Promise<StudentBatchInfo[]> => {
    const q = query(collection(db, BATCH_INFO_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate(),
            completedAt: data.completedAt?.toDate()
        } as StudentBatchInfo;
    });
};

/**
 * Fetch public student base details (Name, Roll, Batch) by batchName for registration parsing.
 * Since registration happens before login, this fetches from the public collection securely.
 */
export const getPublicBatchStudents = async (batchName: string): Promise<PublicStudentInfo[]> => {
    try {
        const q = query(
            collection(db, PUBLIC_STUDENTS_COLLECTION),
            orderBy("roll", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => doc.data() as PublicStudentInfo)
            .filter(doc => doc.batchName === batchName); // filter on client since we didn't index batchName
    } catch (error) {
        console.error("Failed to fetch public batch students:", error);
        return [];
    }
};

/**
 * Fetch all unique batch names from the public collection
 * Used for populating the registration dropdown securely
 */
export const getPublicUniqueBatches = async (): Promise<string[]> => {
    try {
        const q = query(collection(db, PUBLIC_STUDENTS_COLLECTION));
        const snapshot = await getDocs(q);
        const uniqueBatches = new Set<string>();
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.batchName) {
                uniqueBatches.add(data.batchName);
            }
        });
        
        return Array.from(uniqueBatches).sort();
    } catch (error) {
        console.error("Failed to fetch unique batch names:", error);
        return [];
    }
};
