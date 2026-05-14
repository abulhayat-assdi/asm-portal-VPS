// ============================================================
// feedbackService — All Firestore calls replaced with API calls
// SSE-based realtime subscription replaces onSnapshot
// ============================================================

export interface Feedback {
    id: string;
    studentName: string;
    batch: string;
    role: string;
    company: string;
    message: string;
    rating: number;
    status: "APPROVED" | "PENDING";
    createdAt: string;
    submittedFrom: string;
    approvedByUid?: string | null;
}

export const getFeedbackList = async (isAdmin = false): Promise<Feedback[]> => {
    const url = isAdmin ? "/api/feedback?all=true" : "/api/feedback";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

export const approveFeedback = async (id: string, adminUid: string): Promise<boolean> => {
    const res = await fetch(`/api/feedback/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUid }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve feedback.");
    }
    return true;
};

export const deleteFeedback = async (id: string, adminUid: string): Promise<boolean> => {
    const res = await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete feedback.");
    }
    return true;
};

export const submitFeedback = async (
    studentName: string,
    batch: string,
    role: string,
    company: string,
    message: string,
    rating: number
): Promise<boolean> => {
    const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, batch, role, company, message, rating }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback.");
    }
    return true;
};

export const getPendingFeedback = async (): Promise<Feedback[]> => {
    const res = await fetch("/api/feedback?status=PENDING", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
};

/**
 * SSE-based realtime subscription for pending feedback.
 * Replaces Firestore onSnapshot.
 * Returns an AbortController — call abort() to stop.
 */
export const subscribeToPendingFeedback = (
    callback: (feedbacks: Feedback[]) => void
): (() => void) => {
    const controller = new AbortController();

    const connect = () => {
        const eventSource = new EventSource("/api/sse/notifications");

        eventSource.addEventListener("feedback", (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.pendingFeedback) {
                    callback(data.pendingFeedback);
                }
            } catch { /* ignore parse errors */ }
        });

        eventSource.onerror = () => {
            eventSource.close();
            if (!controller.signal.aborted) {
                // Reconnect after 5 seconds on error
                setTimeout(connect, 5000);
            }
        };

        controller.signal.addEventListener("abort", () => {
            eventSource.close();
        });
    };

    connect();

    return () => controller.abort();
};
