import {
    collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
    query, orderBy, where, Timestamp
} from "firebase/firestore";
import {
    ref, uploadBytesResumable, getDownloadURL, deleteObject
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type ResourceType = "Presentation" | "Notes" | "Assignment" | "Practice" | "Other";

export interface ModuleResource {
    id: string;
    moduleId: string;           // Firestore doc ID of the Course Module
    moduleTitle: string;        // Title of the Course Module (for grouping)
    teacherName: string;        // Teacher name associated with the module
    teacherUid: string;         // UID of who uploaded
    title: string;
    description?: string;
    fileType: string;           // pdf | pptx | docx | image | other
    fileName: string;
    fileUrl: string;            // Firebase Storage download URL
    storagePath: string;        // Full storage path for deletion
    fileSize?: string;
    resourceType: ResourceType;
    visibleForBatches: string[]; // ['all'] or ['Batch 7', 'Batch 8', ...]
    isHidden: boolean;
    uploadedAt?: any;           // Set by Firestore server
    updatedAt?: any;
}

/**
 * Upload a file to Firebase Storage and return download URL + storage path
 */
export const uploadModuleResourceFile = (
    file: File,
    moduleTitle: string,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; storagePath: string; fileSize: string; fileType: string }> => {
    return new Promise((resolve, reject) => {
        const sanitized = moduleTitle.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);
        const timestamp = Date.now();
        const storagePath = `module_resources/${sanitized}/${timestamp}_${file.name}`;
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
                const ext = file.name.split(".").pop()?.toLowerCase() || "other";
                const fileType = ["pdf", "pptx", "ppt", "docx", "doc"].includes(ext) ? ext
                    : ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? "image"
                    : "other";
                const kb = file.size / 1024;
                const fileSize = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
                resolve({ fileUrl, storagePath, fileSize, fileType });
            }
        );
    });
};

/**
 * Add a new module resource to Firestore
 */
export const addModuleResource = async (
    data: Omit<ModuleResource, "id">
): Promise<string> => {
    const docRef = await addDoc(collection(db, "module_resources"), {
        ...data,
        uploadedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
};

/**
 * Get all resources for a specific module title
 */
export const getModuleResourcesByTitle = async (
    moduleTitle: string
): Promise<ModuleResource[]> => {
    try {
        const q = query(
            collection(db, "module_resources"),
            where("moduleTitle", "==", moduleTitle)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModuleResource));
        // Sort client-side to avoid composite index requirement
        return results.sort((a, b) => {
            const aTime = a.uploadedAt?.toMillis?.() ?? 0;
            const bTime = b.uploadedAt?.toMillis?.() ?? 0;
            return aTime - bTime;
        });
    } catch (err) {
        console.error("Error fetching module resources:", err);
        return [];
    }
};

/**
 * Get all module resources (admin view)
 */
export const getAllModuleResources = async (): Promise<ModuleResource[]> => {
    try {
        const q = query(collection(db, "module_resources"), orderBy("uploadedAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ModuleResource));
    } catch (err) {
        console.error("Error fetching all module resources:", err);
        return [];
    }
};

/**
 * Get resources for a teacher (by teacherUid)
 */
export const getModuleResourcesByTeacher = async (
    teacherUid: string
): Promise<ModuleResource[]> => {
    try {
        const q = query(
            collection(db, "module_resources"),
            where("teacherUid", "==", teacherUid)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModuleResource));
        // Sort client-side to avoid composite index requirement
        return results.sort((a, b) => {
            const aTime = a.uploadedAt?.toMillis?.() ?? 0;
            const bTime = b.uploadedAt?.toMillis?.() ?? 0;
            return bTime - aTime; // desc
        });
    } catch (err) {
        console.error("Error fetching teacher resources:", err);
        return [];
    }
};

/**
 * Update a module resource metadata
 */
export const updateModuleResource = async (
    id: string,
    data: Partial<Omit<ModuleResource, "id" | "uploadedAt">>
): Promise<void> => {
    await updateDoc(doc(db, "module_resources", id), {
        ...data,
        updatedAt: Timestamp.now(),
    });
};

/**
 * Toggle visibility (hide/show)
 */
export const toggleModuleResourceVisibility = async (
    id: string,
    isHidden: boolean
): Promise<void> => {
    await updateDoc(doc(db, "module_resources", id), {
        isHidden,
        updatedAt: Timestamp.now(),
    });
};

/**
 * Delete a module resource (Firestore + Storage)
 */
export const deleteModuleResource = async (
    id: string,
    storagePath: string
): Promise<void> => {
    // Delete from Firestore
    await deleteDoc(doc(db, "module_resources", id));
    // Delete from Firebase Storage
    try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
    } catch (err) {
        console.warn("Storage file may already be deleted:", err);
    }
};
