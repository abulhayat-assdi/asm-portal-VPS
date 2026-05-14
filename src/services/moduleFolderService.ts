// ============================================================
// moduleFolderService — All Firestore calls replaced with API calls
// ============================================================

export interface ModuleFolder {
    id: string;
    moduleId: string;
    moduleTitle: string;
    teacherUid: string;
    teacherName: string;
    title: string;
    description?: string;
    visibleForBatches: string[];
    isHidden: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const addModuleFolder = async (data: Omit<ModuleFolder, "id">): Promise<string> => {
    const res = await fetch("/api/resources/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to add folder.");
    return result.id;
};

export const getModuleFoldersByModule = async (moduleId: string): Promise<ModuleFolder[]> => {
    const res = await fetch(`/api/resources/folders?moduleId=${encodeURIComponent(moduleId)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getModuleFoldersByTeacher = async (teacherUid: string): Promise<ModuleFolder[]> => {
    const res = await fetch(`/api/resources/folders?teacherUid=${encodeURIComponent(teacherUid)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const updateModuleFolder = async (id: string, data: Partial<Omit<ModuleFolder, "id" | "createdAt">>): Promise<void> => {
    const res = await fetch("/api/resources/folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error("Failed to update folder.");
};

export const toggleModuleFolderVisibility = async (id: string, isHidden: boolean): Promise<void> => {
    await updateModuleFolder(id, { isHidden });
};

export const deleteModuleFolder = async (id: string): Promise<void> => {
    const res = await fetch(`/api/resources/folders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete folder.");
};
