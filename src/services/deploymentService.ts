// ============================================================
// deploymentService.ts — Client-side fetch helpers
// ============================================================

export interface Deployment {
    id: string;
    userId: string;
    subdomain: string;
    displayName: string;
    folderPath: string;
    liveUrl: string;
    totalVisitors: number;
    createdAt: string;
    updatedAt: string;
}

export interface DeploymentWithUser extends Deployment {
    user: {
        id: string;
        displayName: string;
        studentBatchName: string | null;
        studentRoll: string | null;
        deploymentLimit: number;
        isDeploymentFrozen: boolean;
    };
}

export interface StudentDeploymentData {
    deployments: Deployment[];
    deploymentLimit: number;
    isDeploymentFrozen: boolean;
}

// ─── Student ──────────────────────────────────────────────────────────────────

export async function getMyDeployments(): Promise<StudentDeploymentData> {
    const res = await fetch("/api/deployments", { cache: "no-store" });
    if (!res.ok) throw new Error((await res.json()).error ?? "Failed to fetch deployments");
    return res.json();
}

export async function validateSubdomain(
    subdomain: string,
    excludeId?: string
): Promise<{ available: boolean; error?: string }> {
    const params = new URLSearchParams({ subdomain });
    if (excludeId) params.set("excludeId", excludeId);
    const res = await fetch(`/api/deployments/validate-subdomain?${params.toString()}`);
    return res.json();
}

export async function deployProject(formData: FormData): Promise<{ deployment: Deployment; liveUrl: string }> {
    const res = await fetch("/api/deployments", {
        method: "POST",
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Deployment failed");
    return data;
}

export async function updateDeployment(
    id: string,
    payload: { subdomain?: string; displayName?: string }
): Promise<{ deployment: Deployment }> {
    const res = await fetch(`/api/deployments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Update failed");
    return data;
}

export async function deleteDeployment(id: string): Promise<void> {
    const res = await fetch(`/api/deployments/${id}`, { method: "DELETE" });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
    }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAllDeployments(
    search?: string
): Promise<{ deployments: DeploymentWithUser[]; stats: { total: number; totalVisitors: number } }> {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/deployments/admin${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error((await res.json()).error ?? "Failed to fetch");
    return res.json();
}

export async function getStudentDeploymentData(
    userId: string
): Promise<{ user: DeploymentWithUser["user"]; deployments: Deployment[] }> {
    const res = await fetch(`/api/deployments/admin/student/${userId}`, { cache: "no-store" });
    if (!res.ok) throw new Error((await res.json()).error ?? "Failed to fetch");
    return res.json();
}

export async function updateStudentDeploymentSettings(
    userId: string,
    payload: { deploymentLimit?: number; isDeploymentFrozen?: boolean }
): Promise<void> {
    const res = await fetch(`/api/deployments/admin/student/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed");
    }
}

export async function adminDeleteDeployment(id: string): Promise<void> {
    const res = await fetch(`/api/deployments/${id}`, { method: "DELETE" });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
    }
}
