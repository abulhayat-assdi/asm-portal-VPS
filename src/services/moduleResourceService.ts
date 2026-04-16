import {
    collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
    query, orderBy, where, Timestamp
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type ResourceType = "Presentation" | "Notes" | "Assignment" | "Practice" | "Other";

export interface ModuleResource {
    id: string;
    moduleId: string;           // Firestore doc ID of the Course Module
    moduleTitle: string;        // Title of the Course Module (for grouping)
    teacherName: string;        // Teacher name associated with the module
    teacherUid: string;         // UID of who uploaded
    folderId?: string | null;   // null = root-level file (no folder), string = folder ID
    title: string;
    description?: string;
    fileType: string;           // pdf | pptx | docx | image | other
    fileName: string;
    fileUrl: string;            // Local API serve URL
    storagePath: string;        // Relative path for API deletion
    fileSize?: string;
    resourceType: ResourceType;
    visibleForBatches: string[]; // ['all'] or ['Batch 7', 'Batch 8', ...]
    isHidden: boolean;
    uploadedAt?: any;           // Set by Firestore server
    updatedAt?: any;
}

/**
 * Upload a file to local storage via API
 */
export const uploadModuleResourceFile = (
    file: File,
    moduleTitle: string,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; storagePath: string; fileSize: string; fileType: string }> => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                reject(new Error("Not authenticated. Please log in again."));
                return;
            }
            const token = await currentUser.getIdToken(true);

            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", "resource");
            formData.append("path", moduleTitle.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50));

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(Math.round(percentComplete));
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const ext = file.name.split(".").pop()?.toLowerCase() || "other";
                        const fileType = ["pdf", "pptx", "ppt", "docx", "doc"].includes(ext) ? ext
                            : ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? "image"
                            : "other";
                        const kb = file.size / 1024;
                        const fileSize = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
                        
                        resolve({ 
                            fileUrl: response.fileUrl, 
                            storagePath: response.storagePath, 
                            fileSize, 
                            fileType 
                        });
                    } catch (err) {
                        reject(new Error("Failed to parse upload response"));
                    }
                } else {
                    reject(new Error(xhr.responseText || "Upload failed"));
                }
            });

            xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
            xhr.open("POST", "/api/storage/upload");
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.send(formData);
        } catch (err) {
            reject(err);
        }
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
 * Get all resources inside a specific folder
 */
export const getModuleResourcesByFolder = async (
    folderId: string
): Promise<ModuleResource[]> => {
    try {
        const q = query(
            collection(db, "module_resources"),
            where("folderId", "==", folderId)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModuleResource));
        return results.sort((a, b) => {
            const aTime = a.uploadedAt?.toMillis?.() ?? 0;
            const bTime = b.uploadedAt?.toMillis?.() ?? 0;
            return aTime - bTime;
        });
    } catch (err) {
        console.error("Error fetching folder resources:", err);
        return [];
    }
};

/**
 * Get root-level files for a module (folderId is null or missing) — backward compatible
 */
export const getModuleResourcesByModuleRoot = async (
    moduleTitle: string
): Promise<ModuleResource[]> => {
    try {
        const q = query(
            collection(db, "module_resources"),
            where("moduleTitle", "==", moduleTitle)
        );
        const snap = await getDocs(q);
        const results = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as ModuleResource))
            .filter(r => !r.folderId); // root = no folderId
        return results.sort((a, b) => {
            const aTime = a.uploadedAt?.toMillis?.() ?? 0;
            const bTime = b.uploadedAt?.toMillis?.() ?? 0;
            return aTime - bTime;
        });
    } catch (err) {
        console.error("Error fetching root module resources:", err);
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
 * Delete a module resource (Firestore + local storage)
 */
export const deleteModuleResource = async (
    id: string,
    storagePath: string
): Promise<void> => {
    // Delete from Firestore
    await deleteDoc(doc(db, "module_resources", id));
    // Delete from local storage via API
    try {
        await fetch(`/api/storage/delete?path=${encodeURIComponent(storagePath)}`, {
            method: "DELETE"
        });
    } catch (err) {
        console.warn("Local storage deletion failed:", err);
    }
};
