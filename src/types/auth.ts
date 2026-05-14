// ============================================================
// Auth Types — No Firebase dependency
// ============================================================

export type UserRole = "admin" | "teacher" | "student";

export interface UserProfile {
    id: string;
    uid?: string; // Backward compatibility for Firebase
    email: string;
    displayName: string;
    role: UserRole;
    teacherId?: string;
    studentBatchName?: string;
    studentRoll?: string;
    profileImageUrl?: string;
    createdAt: Date | string;
    lastLoginAt?: Date | string;
}

export interface AuthContextType {
    user: UserProfile | null;
    userProfile?: UserProfile | null; // Backward compatibility alias
    loading: boolean;
    loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
    registerWithEmail: (email: string, password: string, name: string, batchName: string, roll: string) => Promise<UserProfile>;
    logout: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}
