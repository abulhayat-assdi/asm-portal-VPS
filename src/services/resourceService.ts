import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export interface Resource {
    id: string;
    title: string;
    category: "Course Module" | "Class Routine" | "Notes" | "Assignment" | "Exam / Practice";
    uploadedByUid: string;
    uploadedByName: string;
    uploadDate: string;
    createdAt: any;
    description?: string;
    teacherName?: string;
    order?: number;
    fileUrl: string;
    storagePath?: string; // Firebase Storage path for deletion
    fileName?: string;
}

/**
 * Upload a file to Firebase Storage under the "resources/" path
 */
export const uploadResourceFile = (
    file: File,
    category: string,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; storagePath: string; fileName: string }> => {
    return new Promise((resolve, reject) => {
        const sanitized = category.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
        const timestamp = Date.now();
        const storagePath = `resources/${sanitized}/${timestamp}_${file.name}`;
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
 * Delete a resource file from Firebase Storage
 */
export const deleteResourceFile = async (storagePath: string): Promise<void> => {
    try {
        await deleteObject(ref(storage, storagePath));
    } catch (err) {
        console.warn("Storage file may not exist:", err);
    }
};


/**
 * Fetch all resources from Firestore
 */
export const getAllResources = async (): Promise<Resource[]> => {
    try {
        const resourcesRef = collection(db, "resources");
        const q = query(resourcesRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const mappedResources = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                category: data.category,
                uploadedByUid: data.uploadedByUid,
                uploadedByName: data.uploadedByName,
                description: data.description,
                teacherName: data.teacherName,
                order: data.order,
                fileUrl: data.fileUrl,
                createdAt: data.createdAt,
                // Convert timestamp to readable date string for initial UI requirement
                uploadDate: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            } as Resource;
        });

        // Sort mapped resources by order, treating undefined as a high number
        mappedResources.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
        
        return mappedResources;
    } catch (error) {
        console.error("Error fetching resources:", error);
        return [];
    }
};

/**
 * Add a new resource to Firestore
 */
export const addResource = async (resource: Omit<Resource, "id" | "uploadDate" | "createdAt">): Promise<string> => {
    try {
        const resourcesRef = collection(db, "resources");
        const data: any = {
            ...resource,
            createdAt: Timestamp.now(),
        };

        // Remove undefined fields if they exist (Firestore doesn't allow undefined)
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const docRef = await addDoc(resourcesRef, data);
        return docRef.id;
    } catch (error) {
        console.error("Error adding resource:", error);
        throw error;
    }
};

/**
 * Update an existing resource in Firestore
 */
export const updateResource = async (
    id: string,
    data: Partial<Omit<Resource, "id" | "uploadDate" | "createdAt">>
): Promise<void> => {
    try {
        const resourceRef = doc(db, "resources", id);
        // Remove undefined fields
        const updateData: any = { ...data };
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        
        await updateDoc(resourceRef, updateData);
    } catch (error) {
        console.error("Error updating resource:", error);
        throw error;
    }
};

/**
 * Delete a resource from Firestore
 */
export const deleteResource = async (id: string): Promise<void> => {
    try {
        const resourceRef = doc(db, "resources", id);
        await deleteDoc(resourceRef);
    } catch (error) {
        console.error("Error deleting resource:", error);
        throw error;
    }
};
