// ============================================================
// policyService — All Firestore calls replaced with API calls
// ============================================================

export interface Policy {
    id: string;
    title: string;
    date: string;
    version: string;
    fileUrl: string;
    sortOrder: number;
    createdAt?: string;
}

export interface MeetingMinute {
    id: string;
    title: string;
    date: string;
    meetingNumber: string;
    fileUrl: string;
    sortOrder: number;
    createdAt?: string;
}

export const getAllPolicies = async (): Promise<Policy[]> => {
    const res = await fetch("/api/policies?type=policy", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const getAllMeetingMinutes = async (): Promise<MeetingMinute[]> => {
    const res = await fetch("/api/policies?type=meeting", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const addPolicy = async (data: { title: string; version: string; fileUrl: string; sortOrder: number }): Promise<string> => {
    const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "policy", ...data }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to add policy.");
    return result.id;
};

export const addMeetingMinute = async (data: { title: string; meetingNumber: string; fileUrl: string; sortOrder: number }): Promise<string> => {
    const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "meeting", ...data }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to add meeting minute.");
    return result.id;
};

export const updatePolicy = async (id: string, data: Partial<Omit<Policy, "id" | "createdAt" | "date">>): Promise<void> => {
    const res = await fetch("/api/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "policy", ...data }),
    });
    if (!res.ok) throw new Error("Failed to update policy.");
};

export const deletePolicy = async (id: string): Promise<void> => {
    const res = await fetch(`/api/policies?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete policy.");
};

export const updateMeetingMinute = async (id: string, data: Partial<Omit<MeetingMinute, "id" | "createdAt" | "date">>): Promise<void> => {
    const res = await fetch("/api/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "meeting", ...data }),
    });
    if (!res.ok) throw new Error("Failed to update meeting minute.");
};

export const deleteMeetingMinute = async (id: string): Promise<void> => {
    const res = await fetch(`/api/policies?id=${encodeURIComponent(id)}&type=meeting`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete meeting minute.");
};
