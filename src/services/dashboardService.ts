import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, Timestamp, orderBy, FieldValue } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";

// Types
export interface Class {
    id: string;
    date: string;
    day: string;
    batch: string;
    subject: string;
    time: string;
    status: "Today" | "Completed" | "Pending" | "Upcoming" | "COMPLETED" | "PENDING";
}

export interface Notice {
    id: string;
    title: string;
    description: string;
    date: string;
    priority: "normal" | "urgent";
    createdBy?: string;
    createdByName?: string;
    createdAt?: Timestamp | Date | FieldValue | null;
    updatedAt?: Timestamp | Date | FieldValue | null;
}

export interface StudentNotice {
    id: string;
    title: string;
    description: string;
    date: string;
    priority: "normal" | "urgent";
    createdBy?: string;
    createdByName?: string;
    createdAt?: Timestamp | Date | FieldValue | null;
    updatedAt?: Timestamp | Date | FieldValue | null;
}


/**
 * Add a new notice to Firestore
 */
export const addNotice = async (notice: Omit<Notice, "id">): Promise<string> => {
    try {
        const noticesRef = collection(db, COLLECTIONS.NOTICES);
        const docRef = await addDoc(noticesRef, notice);
        return docRef.id;
    } catch (error: unknown) {
        console.error("Error adding notice:", error);
        throw new Error("Failed to add notice. Please check your connection.");
    }
};

/**
 * Update an existing notice in Firestore
 */
export const updateNotice = async (
    id: string,
    data: Partial<Omit<Notice, 'id'>>
): Promise<void> => {
    try {
        const noticeRef = doc(db, COLLECTIONS.NOTICES, id);
        await updateDoc(noticeRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    } catch (error: unknown) {
        console.error("Error updating notice:", error);
        throw new Error("Failed to update notice.");
    }
};

/**
 * Delete a notice from Firestore
 */
export const deleteNotice = async (id: string): Promise<void> => {
    try {
        const noticeRef = doc(db, COLLECTIONS.NOTICES, id);
        await deleteDoc(noticeRef);
    } catch (error: unknown) {
        console.error("Error deleting notice:", error);
        throw new Error("Failed to delete notice.");
    }
};

/**
 * Add a new student notice to Firestore
 */
export const addStudentNotice = async (notice: Omit<StudentNotice, "id">): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.STUDENT_NOTICES), notice);
        return docRef.id;
    } catch (error: unknown) {
        console.error("Error adding student notice:", error);
        throw new Error("Failed to add student notice.");
    }
};

/**
 * Fetch all student notices from Firestore
 */
export const getAllStudentNotices = async (): Promise<StudentNotice[]> => {
    try {
        const q = query(collection(db, COLLECTIONS.STUDENT_NOTICES), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentNotice));
    } catch (error: unknown) {
        console.error("Error fetching student notices:", error);
        return [];
    }
};

/**
 * Update an existing student notice in Firestore
 */
export const updateStudentNotice = async (
    id: string,
    data: Partial<Omit<StudentNotice, 'id'>>
): Promise<void> => {
    try {
        await updateDoc(doc(db, COLLECTIONS.STUDENT_NOTICES, id), {
            ...data,
            updatedAt: Timestamp.now()
        });
    } catch (error: unknown) {
        console.error("Error updating student notice:", error);
        throw new Error("Failed to update student notice.");
    }
};

/**
 * Delete a student notice from Firestore
 */
export const deleteStudentNotice = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.STUDENT_NOTICES, id));
    } catch (error: unknown) {
        console.error("Error deleting student notice:", error);
        throw new Error("Failed to delete student notice.");
    }
};

/**
 * Fetch all classes from Firestore
 */
export const getAllClasses = async (): Promise<Class[]> => {
    try {
        const classesRef = collection(db, COLLECTIONS.CLASSES);
        const snapshot = await getDocs(classesRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Class));
    } catch (error: unknown) {
        console.error("Error fetching classes:", error);
        return [];
    }
};

/**
 * Fetch all notices from Firestore
 */
export const getAllNotices = async (): Promise<Notice[]> => {
    try {
        const q = query(collection(db, COLLECTIONS.NOTICES), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notice));
    } catch (error: unknown) {
        console.error("Error fetching notices:", error);
        return [];
    }
};

/**
 * Get today's classes count
 */
export const getTodayClassesCount = (classes: Class[]): number => {
    const today = new Date().toISOString().split('T')[0];
    return classes.filter(cls => cls.date === today).length;
};

/**
 * Get completed classes count for current month
 */
export const getCompletedClassesThisMonth = (classes: Class[]): number => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return classes.filter(cls => {
        const classDate = new Date(cls.date);
        return (cls.status === "COMPLETED" || cls.status === "Completed") &&
            classDate.getMonth() === currentMonth &&
            classDate.getFullYear() === currentYear;
    }).length;
};

/**
 * Get pending classes count for current month
 */
export const getPendingClassesThisMonth = (classes: Class[]): number => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return classes.filter(cls => {
        const classDate = new Date(cls.date);
        return (cls.status === "PENDING" || cls.status === "Pending") &&
            classDate.getMonth() === currentMonth &&
            classDate.getFullYear() === currentYear;
    }).length;
};
