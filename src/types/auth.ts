import { User } from "firebase/auth";

export type UserRole = "admin" | "teacher";

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    teacherId?: string; // Teacher ID for verifying class schedule (e.g. "102")
    profileImageUrl?: string; // User's avatar or profile picture
    createdAt: Date;
    lastLogin: Date;
}

export interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
}
