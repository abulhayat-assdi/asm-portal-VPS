import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getImageUrl } from "@/lib/getImageUrl";
import { COLLECTIONS } from "@/lib/constants";

const TEACHER_IMAGES: Record<string, string> = {
    "Golam Kibria": "instructors/golam-kibria.jpeg",
    "Shaibal Shariar": "instructors/shaibal-shariar.jpg",
    "Mohammad Abu Zabar Rezvhe": "instructors/abu-zabar-rezvhe.jpg",
    "Md. Nesar Uddin": "instructors/nesar-uddin.jpg",
    "Abul Hayat": "instructors/abul-hayat.jpg",
    "M M Naim Amran": "instructors/naim-amran.jpg",
};

export interface Teacher {
    id: string;           // Firestore Doc ID
    teacherId: string;    // Custom ID like ID-101
    name: string;
    designation: string;
    about: string;
    phone: string;
    email: string;        // Display email (shown on portal & public page)
    loginEmail?: string;  // Login email (used for Firebase Auth login) - if missing, falls back to email
    profileImageUrl?: string;
    isAdmin: boolean;
    order?: number;       // Serial number for sorting
}

/**
 * Fetch all teachers from Firestore
 */
export const getAllTeachers = async (): Promise<Teacher[]> => {
    try {
        const teachersRef = collection(db, COLLECTIONS.TEACHERS);
        const snapshot = await getDocs(teachersRef);

        const teachers = snapshot.docs.map(docSnap => {
            const data = docSnap.data() as Omit<Teacher, 'id'>;
            // Fallback to public images if their profileImageUrl is missing
            if (!data.profileImageUrl && TEACHER_IMAGES[data.name]) {
                data.profileImageUrl = getImageUrl(TEACHER_IMAGES[data.name]);
            }
            return {
                id: docSnap.id,
                ...data
            } as Teacher;
        });

        // Sort in-memory by order field (no Firestore composite index needed)
        return teachers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    } catch (error: unknown) {
        console.error("Error fetching teachers:", error);
        return [];
    }
};

/**
 * Fetch teachers with cursor-based pagination
 */
export const getTeachersPaginated = async (
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null
): Promise<{ teachers: Teacher[]; nextCursor: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> => {
    try {
        const teachersRef = collection(db, COLLECTIONS.TEACHERS);
        
        let q = query(teachersRef, orderBy("order", "asc"), limit(pageSize));
        if (lastDoc) {
            q = query(teachersRef, orderBy("order", "asc"), startAfter(lastDoc), limit(pageSize));
        }

        const snapshot = await getDocs(q);

        const teachers = snapshot.docs.map(docSnap => {
            const data = docSnap.data() as Omit<Teacher, 'id'>;
            // Fallback to public images if their profileImageUrl is missing
            if (!data.profileImageUrl && TEACHER_IMAGES[data.name]) {
                data.profileImageUrl = getImageUrl(TEACHER_IMAGES[data.name]);
            }
            return {
                id: docSnap.id,
                ...data
            } as Teacher;
        });

        const nextCursor = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;

        return { teachers, nextCursor, hasMore: snapshot.docs.length === pageSize };

    } catch (error: unknown) {
        console.error("Error fetching paginated teachers:", error);
        return { teachers: [], nextCursor: null, hasMore: false };
    }
};

/**
 * Add a new teacher to Firestore
 */
export const addTeacher = async (data: {
    teacherId: string;
    name: string;
    designation: string;
    about: string;
    phone: string;
    email: string;         // display email
    loginEmail?: string;   // login email (for Firebase Auth)
    profileImageUrl?: string;
    isAdmin?: boolean;
    order?: number;
}): Promise<string> => {
    try {
        const teachersRef = collection(db, COLLECTIONS.TEACHERS);
        const docRef = await addDoc(teachersRef, {
            teacherId: data.teacherId,
            name: data.name,
            designation: data.designation,
            about: data.about || "",
            phone: data.phone,
            email: data.email,           // display email
            loginEmail: data.loginEmail || data.email,  // login email, falls back to display email
            profileImageUrl: data.profileImageUrl || "",
            isAdmin: data.isAdmin || false,
            order: data.order || 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error: unknown) {
        console.error("Error adding teacher:", error);
        throw new Error("Failed to add teacher to directory.");
    }
};

/**
 * Update an existing teacher in Firestore
 */
export const updateTeacher = async (
    id: string,
    data: Partial<Omit<Teacher, 'id'>>
): Promise<void> => {
    try {
        const teacherRef = doc(db, COLLECTIONS.TEACHERS, id);
        await updateDoc(teacherRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error: unknown) {
        console.error("Error updating teacher:", error);
        throw new Error("Failed to update teacher information.");
    }
};

/**
 * Delete a teacher from Firestore
 */
export const deleteTeacher = async (id: string): Promise<void> => {
    try {
        const teacherRef = doc(db, COLLECTIONS.TEACHERS, id);
        await deleteDoc(teacherRef);
    } catch (error: unknown) {
        console.error("Error deleting teacher:", error);
        throw new Error("Failed to delete teacher.");
    }
};
