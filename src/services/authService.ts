import { UserProfile } from "@/types/auth";

// ============================================================
// Client-side auth service — all calls go to our API routes
// No Firebase SDK dependencies
// ============================================================

/**
 * Login with email and password
 */
export const loginWithEmail = async (email: string, password: string): Promise<UserProfile> => {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed.");
    return data.user as UserProfile;
};

/**
 * Register new student account via API
 */
export const registerWithEmail = async (
    email: string,
    password: string,
    name: string,
    batchName: string,
    roll: string
): Promise<void> => {
    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, batchName, roll }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed.");
};

/**
 * Logout — clears the session cookie
 */
export const logout = async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "DELETE" });
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
    const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send password reset email.");
    }
};

/**
 * Get the current user profile from the server
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) return res.json();
        return null;
    } catch {
        return null;
    }
};

/**
 * Update student batch link (after registration)
 */
export const linkStudentProfile = async (
    batchName: string,
    roll: string
): Promise<void> => {
    const res = await fetch("/api/student/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentBatchName: batchName, studentRoll: roll }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to link student profile.");
    }
};
