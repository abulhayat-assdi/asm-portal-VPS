import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, orderBy, Timestamp, where } from "firebase/firestore";
import { StudentBatchInfo } from "./batchInfoService";

export interface StudentUpdateRequest {
    id: string;
    studentUid: string;
    studentName: string;
    studentBatchName: string;
    studentRoll: string;
    // Fields to update
    proposedChanges: Partial<{
        phone: string;
        address: string;
        dob: string;
        educationalDegree: string;
        category: "Alim" | "General" | "";
        bloodGroup: string;
        courseStatus: string;
        currentlyDoing: string;
        companyName: string;
        businessName: string;
        salary: string;
    }>;
    currentData: Partial<StudentBatchInfo>;
    status: "pending" | "approved" | "rejected";
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    adminNote?: string;
}

const STUDENT_UPDATES_COLLECTION = "student_profile_updates";
const BATCH_INFO_COLLECTION = "batch_info";

/**
 * Submit a new update request from a student
 */
export const submitUpdateRequest = async (
    studentUid: string,
    studentName: string,
    batchName: string,
    roll: string,
    proposedChanges: StudentUpdateRequest["proposedChanges"],
    currentData: Partial<StudentBatchInfo>
): Promise<void> => {
    const docRef = doc(collection(db, STUDENT_UPDATES_COLLECTION));

    await setDoc(docRef, {
        id: docRef.id,
        studentUid,
        studentName,
        studentBatchName: batchName,
        studentRoll: roll,
        proposedChanges,
        currentData,
        status: "pending",
        submittedAt: Timestamp.now(),
    });
};

/**
 * Get all pending update requests
 */
export const getAllUpdateRequests = async (): Promise<StudentUpdateRequest[]> => {
    const q = query(collection(db, STUDENT_UPDATES_COLLECTION), orderBy("submittedAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            submittedAt: data.submittedAt?.toDate(),
            reviewedAt: data.reviewedAt?.toDate(),
        } as StudentUpdateRequest;
    });
};

/**
 * Approve an update request — auto-updates batch_info and marks request done
 */
export const approveUpdateRequest = async (
    requestId: string,
    reviewerName: string
): Promise<void> => {
    const reqDocRef = doc(db, STUDENT_UPDATES_COLLECTION, requestId);
    const reqSnap = await getDoc(reqDocRef);

    if (!reqSnap.exists()) throw new Error("Request not found");

    const req = reqSnap.data() as StudentUpdateRequest;
    const docId = `${req.studentBatchName.replace(/\s+/g, '_')}_${req.studentRoll}`;
    const batchDocRef = doc(db, BATCH_INFO_COLLECTION, docId);

    // Build update payload from proposedChanges (strip undefined)
    const updatePayload: Record<string, any> = {};
    Object.entries(req.proposedChanges || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
            updatePayload[key] = key === "salary" ? Number(value) : value;
        }
    });

    // Update the actual batch record
    await updateDoc(batchDocRef, updatePayload);

    // Mark the request as approved
    await updateDoc(reqDocRef, {
        status: "approved",
        reviewedAt: Timestamp.now(),
        reviewedBy: reviewerName,
    });
};

/**
 * Reject an update request
 */
export const rejectUpdateRequest = async (
    requestId: string,
    reviewerName: string,
    adminNote: string
): Promise<void> => {
    const reqDocRef = doc(db, STUDENT_UPDATES_COLLECTION, requestId);

    await updateDoc(reqDocRef, {
        status: "rejected",
        reviewedAt: Timestamp.now(),
        reviewedBy: reviewerName,
        adminNote,
    });
};
