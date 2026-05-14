// ============================================================
// moduleResourceService — All Firebase calls replaced with API calls
// ============================================================

export type ResourceType = "Presentation" | "Notes" | "Assignment" | "Practice" | "Other";

export interface ModuleResource {
    id: string;
    moduleId: string;
    moduleTitle: string;
    teacherName: string;
    teacherUid: string;
    folderId?: string | null;
    title: string;
    description?: string;
    fileType: string;
    fileName: string;
    fileUrl: string;
    storagePath: string;
    fileSize?: string;
    resourceType: ResourceType;
    visibleForBatches: string[];
    isHidden: boolean;
    uploadedAt?: string;
    updatedAt?: string;
}

/**
 * Upload a file to local storage via API.
 * Session cookie is sent automatically — no Firebase ID token needed.
 */
export const uploadModuleResourceFile = (
    file: File,
    moduleTitle: string,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; storagePath: string; fileSize: string; fileType: string }> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "resource");
        formData.append("path", moduleTitle.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50));

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress(Math.round((event.loaded / event.total) * 100));
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
                    resolve({ fileUrl: response.fileUrl, storagePath: response.storagePath, fileSize, fileType });
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

export const addModuleResource = async (data: Omit<ModuleResource, "id">): Promise<string> => {
    const res = await fetch("/api/resources/module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to add resource.");
    return result.id;
};

export const getModuleResourcesByTitle = async (moduleTitle: string): Promise<ModuleResource[]> => {
    const res = await fetch(`/api/resources/module?moduleTitle=${encodeURIComponent(moduleTitle)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getModuleResourcesByFolder = async (folderId: string): Promise<ModuleResource[]> => {
    const res = await fetch(`/api/resources/module?folderId=${encodeURIComponent(folderId)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getModuleResourcesByModuleRoot = async (moduleTitle: string): Promise<ModuleResource[]> => {
    const res = await fetch(`/api/resources/module?moduleTitle=${encodeURIComponent(moduleTitle)}&root=true`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getAllModuleResources = async (): Promise<ModuleResource[]> => {
    const res = await fetch("/api/resources/module?all=true", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getModuleResourcesByTeacher = async (teacherUid: string): Promise<ModuleResource[]> => {
    const res = await fetch(`/api/resources/module?teacherUid=${encodeURIComponent(teacherUid)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const updateModuleResource = async (id: string, data: Partial<Omit<ModuleResource, "id" | "uploadedAt">>): Promise<void> => {
    const res = await fetch("/api/resources/module", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error("Failed to update resource.");
};

export const toggleModuleResourceVisibility = async (id: string, isHidden: boolean): Promise<void> => {
    await updateModuleResource(id, { isHidden });
};

export const deleteModuleResource = async (id: string, storagePath: string): Promise<void> => {
    const res = await fetch(`/api/resources/module?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete resource.");
    // Delete physical file
    try {
        await fetch(`/api/storage/delete?path=${encodeURIComponent(storagePath)}`, { method: "DELETE" });
    } catch (err) {
        console.warn("Storage file deletion failed:", err);
    }
};
