import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, Timestamp, orderBy, FieldValue } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
}

/**
 * Add a new notice to Firestore
 */
export const addNotice = async (notice: Omit<Notice, "id">): Promise<string> => {
    try {
        const noticesRef = collection(db, "notices");
        const docRef = await addDoc(noticesRef, notice);
        return docRef.id;
    } catch (error) {
        console.error("Error adding notice:", error);
        throw error;
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
        const noticeRef = doc(db, "notices", id);
        await updateDoc(noticeRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error updating notice:", error);
        throw error;
    }
};

/**
 * Delete a notice from Firestore
 */
export const deleteNotice = async (id: string): Promise<void> => {
    try {
        const noticeRef = doc(db, "notices", id);
        await deleteDoc(noticeRef);
    } catch (error) {
        console.error("Error deleting notice:", error);
        throw error;
    }
};

/**
 * Add a new student notice to Firestore
 */
export const addStudentNotice = async (notice: Omit<StudentNotice, "id">): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, "student_notices"), notice);
        return docRef.id;
    } catch (error) {
        console.error("Error adding student notice:", error);
        throw error;
    }
};

/**
 * Fetch all student notices from Firestore
 */
export const getAllStudentNotices = async (): Promise<StudentNotice[]> => {
    try {
        const q = query(collection(db, "student_notices"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentNotice));
    } catch (error) {
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
        await updateDoc(doc(db, "student_notices", id), {
            ...data,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error updating student notice:", error);
        throw error;
    }
};

/**
 * Delete a student notice from Firestore
 */
export const deleteStudentNotice = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "student_notices", id));
    } catch (error) {
        console.error("Error deleting student notice:", error);
        throw error;
    }
};

/**
 * Fetch all classes from Firestore
 */
export const getAllClasses = async (): Promise<Class[]> => {
    try {
        const classesRef = collection(db, "classes");
        const snapshot = await getDocs(classesRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Class));
    } catch (error) {
        console.error("Error fetching classes:", error);
        return [];
    }
};

/**
 * Fetch all notices from Firestore
 */
export const getAllNotices = async (): Promise<Notice[]> => {
    try {
        const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notice));
    } catch (error) {
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
