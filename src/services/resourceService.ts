import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    storagePath?: string; // Relative path for API deletion
    fileName?: string;
}

/**
 * Upload a file to local storage via API
 */
export const uploadResourceFile = (
    file: File,
    category: string,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; storagePath: string; fileName: string }> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "resource");
        formData.append("path", category.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40));

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
                    resolve({
                        fileUrl: response.fileUrl,
                        storagePath: response.storagePath,
                        fileName: response.fileName
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
        xhr.send(formData);
    });
};

/**
 * Delete a resource file from local storage via API
 */
export const deleteResourceFile = async (storagePath: string): Promise<void> => {
    try {
        await fetch(`/api/storage/delete?path=${encodeURIComponent(storagePath)}`, {
            method: "DELETE"
        });
    } catch (err) {
        console.warn("Local storage deletion failed:", err);
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
                storagePath: data.storagePath,
                fileName: data.fileName,
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
