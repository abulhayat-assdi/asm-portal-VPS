// ============================================================
// resourceService — All Firebase calls replaced with API calls
// ============================================================

export interface Resource {
    id: string;
    title: string;
    category: "Course Module" | "Class Routine" | "Notes" | "Assignment" | "Exam / Practice";
    uploadedByUid: string;
    uploadedByName: string;
    uploadDate: string;
    createdAt?: string;
    description?: string;
    teacherName?: string;
    order?: number;
    fileUrl: string;
    storagePath?: string;
    fileName?: string;
}

/**
 * Upload a resource file via the storage API.
 * Session cookie is sent automatically — no Firebase ID token needed.
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
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve({ fileUrl: response.fileUrl, storagePath: response.storagePath, fileName: response.fileName });
                } catch {
                    reject(new Error("Failed to parse upload response"));
                }
            } else {
                reject(new Error(xhr.responseText || "Upload failed"));
            }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.open("POST", "/api/storage/upload");
        // Cookie sent automatically — no auth header needed
        xhr.send(formData);
    });
};

export const deleteResourceFile = async (storagePath: string): Promise<void> => {
    try {
        await fetch(`/api/storage/delete?path=${encodeURIComponent(storagePath)}`, { method: "DELETE" });
    } catch (err) {
        console.warn("Storage file deletion failed:", err);
    }
};

export const getAllResources = async (): Promise<Resource[]> => {
    const res = await fetch("/api/resources", { cache: "no-store" });
    if (!res.ok) return [];
    const data: Resource[] = await res.json();
    return data.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
};

export const addResource = async (resource: Omit<Resource, "id" | "uploadDate" | "createdAt">): Promise<string> => {
    const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resource),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add resource.");
    return data.id;
};

export const updateResource = async (id: string, data: Partial<Omit<Resource, "id" | "uploadDate" | "createdAt">>): Promise<void> => {
    const res = await fetch("/api/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error("Failed to update resource.");
};

export const deleteResource = async (id: string): Promise<void> => {
    const res = await fetch(`/api/resources?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete resource.");
};
