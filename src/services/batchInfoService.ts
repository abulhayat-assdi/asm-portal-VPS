import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, Timestamp, where, writeBatch, QueryDocumentSnapshot } from "firebase/firestore";

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
    totalPaidTK?: string | number;
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
    batchType?: "Running" | "Completed";
}

/**
 * Saves or updates a full batch of students.
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
        const docId = `${batchName.replace(/\s+/g, '_')}_${student.roll}`;
        newIds.add(docId);
        
        const docRef = doc(db, BATCH_INFO_COLLECTION, docId);
        
        const docData: Record<string, unknown> = {
            ...student,
            id: docId,
            batchName,
            batchType,
            salary: Number(student.salary) || 0,
            createdAt: Timestamp.now()
        };

        if (batchType === "Completed" && completedAt) {
            docData.completedAt = Timestamp.fromDate(completedAt);
        }

        const savePrivate = setDoc(docRef, docData, { merge: true });

        const publicDocRef = doc(db, PUBLIC_STUDENTS_COLLECTION, docId);
        const savePublic = setDoc(publicDocRef, {
            id: docId,
            batchName,
            roll: student.roll,
            name: student.name,
            batchType, 
            createdAt: Timestamp.now()
        }, { merge: true });

        return Promise.all([savePrivate, savePublic]);
    });

    await Promise.all(savePromises);

    const deletePromises = existingIds
        .filter(id => !newIds.has(id))
        .map(id => Promise.all([
            deleteDoc(doc(db, BATCH_INFO_COLLECTION, id)),
            deleteDoc(doc(db, PUBLIC_STUDENTS_COLLECTION, id))
        ]));
        
    await Promise.all(deletePromises);

    if (batchType === "Completed") {
        try {
            const trackerReportsRef = collection(db, "daily_tracker_reports");
            const qTracker = query(trackerReportsRef, where("batchName", "==", batchName));
            const trackerSnap = await getDocs(qTracker);
            
            if (!trackerSnap.empty) {
                const chunks: QueryDocumentSnapshot[][] = [];
                for (let i = 0; i < trackerSnap.docs.length; i += 500) {
                    chunks.push(trackerSnap.docs.slice(i, i + 500));
                }

                for (const chunk of chunks) {
                    const batchDeletion = writeBatch(db);
                    chunk.forEach((reportDoc: QueryDocumentSnapshot) => {
                        batchDeletion.delete(reportDoc.ref);
                    });
                    await batchDeletion.commit();
                }
            }
        } catch (cleanupError) {
            console.error("Failed to auto-cleanup tracker reports:", cleanupError);
        }
    }
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
            .filter(doc => doc.batchName === batchName); 
    } catch (error) {
        console.error("Failed to fetch public batch students:", error);
        return [];
    }
};

/**
 * Fetch all unique batch names from the public collection.
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

/**
 * Interface representing a generic batch metadata item
 */
export interface BatchMetadata {
    name: string;
    status: string;
}

/**
 * Fetch all batch metadata from multiple sources for robust client-side filtering.
 */
export const getRawBatchesPublic = async (): Promise<BatchMetadata[]> => {
    try {
        const batchMap = new Map<string, BatchMetadata>();

        // 1. Fetch from 'batches' collection
        try {
            const snap = await getDocs(collection(db, "batches"));
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.name) {
                    batchMap.set(data.name, {
                        name: data.name,
                        status: data.status || ""
                    });
                }
            });
        } catch (e) { console.error("Error fetching batches:", e); }

        // 2. Fetch from 'public_batch_students' to capture batches that might not be in metadata
        try {
            const snap = await getDocs(collection(db, PUBLIC_STUDENTS_COLLECTION));
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.batchName && !batchMap.has(data.batchName)) {
                    batchMap.set(data.batchName, {
                        name: data.batchName,
                        status: data.batchType || "" // Don't assume 'Running' for legacy data
                    });
                } else if (data.batchName && data.batchType) {
                    // Update status if it exists in public students (more likely to be updated)
                    const existing = batchMap.get(data.batchName)!;
                    // Priority: if any student says it's running, it might be running
                    if (data.batchType === "Running") {
                        existing.status = "Running";
                    }
                }
            });
        } catch (e) { console.error("Error fetching public students:", e); }

        return Array.from(batchMap.values());
    } catch (error) {
        console.error("Failed to fetch raw batches:", error);
        return [];
    }
};

/**
 * Legacy support for direct name fetching
 */
export const getRunningBatchesPublic = async (): Promise<string[]> => {
    const raw = await getRawBatchesPublic();
    return raw
        .filter(b => b.status?.trim().toLowerCase() === "running" || b.status?.trim().toLowerCase() === "active")
        .map(b => b.name)
        .sort();
};
