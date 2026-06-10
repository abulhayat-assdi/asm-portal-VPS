// ============================================================
// moduleFolderService
// ============================================================

export interface ModuleFolder {
    id: string;
    teacherUid: string;
    teacherName: string;
    parentFolderId?: string | null;
    title: string;
    description?: string;
    visibleForBatches: string[];
    isHidden: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ResourceTeacher {
    teacherUid: string;
    teacherName: string;
    designation: string;
    profileImageUrl: string | null;
    order: number;
}

// ── Teacher list ───────────────────────────────────────────────

export const getResourceTeachers = async (): Promise<ResourceTeacher[]> => {
    const res = await fetch("/api/resources/teachers", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

// ── Folder CRUD ────────────────────────────────────────────────

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

/** Root folders for a teacher (no parent). Throws on 5xx so caller can show setup UI. */
export const getRootFoldersByTeacher = async (teacherUid: string): Promise<ModuleFolder[]> => {
    const res = await fetch(`/api/resources/folders?teacherUid=${encodeURIComponent(teacherUid)}`, { cache: "no-store" });
    if (res.status >= 500) throw new Error("server_error");
    if (!res.ok) return [];
    return res.json();
};

/** Sub-folders of a given folder */
export const getSubFolders = async (parentFolderId: string): Promise<ModuleFolder[]> => {
    const res = await fetch(`/api/resources/folders?parentFolderId=${encodeURIComponent(parentFolderId)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

/** All folders for a teacher (root + sub) */
export const getAllFoldersByTeacher = async (teacherUid: string): Promise<ModuleFolder[]> => {
    const res = await fetch(`/api/resources/folders?teacherUid=${encodeURIComponent(teacherUid)}&all=false`, { cache: "no-store" });
    if (!res.ok) return [];
    // fetch all then filter client side
    const all = await fetch(`/api/resources/folders?all=true`, { cache: "no-store" });
    if (!all.ok) return [];
    const folders: ModuleFolder[] = await all.json();
    return folders.filter(f => f.teacherUid === teacherUid);
};

// Keep backward compat alias
export const getModuleFoldersByTeacher = getRootFoldersByTeacher;
export const getModuleFoldersByModule  = getRootFoldersByTeacher;

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
