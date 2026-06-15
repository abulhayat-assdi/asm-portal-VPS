// ============================================================
// routinesService — per-batch routine IMAGE (one image per batch)
// ============================================================

export interface BatchRoutine {
    id: string;
    batchName: string;
    fileUrl: string;
    storagePath: string;
    fileName: string;
    uploadedBy?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}

const normalizeRoutineUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("/api/uploads/")) return url;

    const clean = url.startsWith("/") ? url.slice(1) : url;
    return `/api/uploads/${clean}`;
};

/** Get the current routine image for a batch (or null if none uploaded). */
export const getRoutineByBatch = async (batchName: string): Promise<BatchRoutine | null> => {
    try {
        const res = await fetch(`/api/routines?batchName=${encodeURIComponent(batchName)}`, { cache: "no-store" });
        if (!res.ok) return null;
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) return null;

        const [first] = list;
        return {
            ...first,
            fileUrl: normalizeRoutineUrl(first.fileUrl || first.storagePath || ""),
            storagePath: first.storagePath || first.fileUrl || "",
        };
    } catch {
        return null;
    }
};

/**
 * Upload (or replace) the routine image for a batch.
 * Uploads the file, then records it — the API removes any previous image.
 */
export const uploadRoutineImage = async (batchName: string, file: File): Promise<BatchRoutine> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "routines");

    const up = await fetch("/api/upload", { method: "POST", body: fd });
    const upData = await up.json();
    if (!up.ok) throw new Error(upData.error || "File upload failed.");

    const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            batchName,
            fileUrl: upData.url,
            storagePath: upData.url,
            fileName: file.name,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save routine.");
    return data;
};

/** Delete a routine image by id. */
export const deleteRoutine = async (id: string): Promise<void> => {
    const res = await fetch(`/api/routines?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete routine.");
};
