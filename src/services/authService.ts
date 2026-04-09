import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail,
    User,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types/auth";
import { COOKIES, AUTH_ROLES, COLLECTIONS } from "@/lib/constants";

const googleProvider = new GoogleAuthProvider();

interface FirebaseAuthError extends Error {
    code: string;
}

/**
 * Login with Email and Password
 */
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await updateLastLogin(userCredential.user.uid);
        return userCredential.user;
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            throw new Error(getAuthErrorMessage((error as FirebaseAuthError).code));
        }
        throw new Error("An unexpected error occurred during login.");
    }
};

/**
 * Register with Email and Password via Secure API
 */
export const registerWithEmail = async (
    email: string,
    password: string,
    name: string,
    batchName: string,
    roll: string
): Promise<void> => {
    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name, batchName, roll }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to register account.");
        }

        // After successful API registration, log the user in locally
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
        if (error instanceof Error) throw error;
        throw new Error("An unexpected error occurred during registration.");
    }
};

/**
 * Login with Google
 */
export const loginWithGoogle = async (): Promise<User> => {
    try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const user = userCredential.user;

        // Check if user profile exists, if not create one
        const userProfile = await getUserProfile(user.uid);
        if (!userProfile) {
            // Create new user profile with default role "student"
            await createUserProfile(user.uid, user.email!, user.displayName || "User", AUTH_ROLES.STUDENT);
        } else {
            await updateLastLogin(user.uid);
        }

        return user;
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            throw new Error(getAuthErrorMessage((error as FirebaseAuthError).code));
        }
        throw new Error("An unexpected error occurred during Google login.");
    }
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error: unknown) {
        throw new Error("Failed to logout. Please try again.");
    }
};

/**
 * Send Password Reset Email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            throw new Error(getAuthErrorMessage((error as FirebaseAuthError).code));
        }
        throw new Error("Failed to send password reset email.");
    }
};

/**
 * Get User Profile from Firestore (Client-side version)
 * Used mainly for checking existence. Profile enrichment is now server-side.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                uid: data.uid,
                email: data.email,
                displayName: data.displayName,
                role: data.role as UserRole,
                teacherId: data.teacherId,
                studentBatchName: data.studentBatchName,
                studentRoll: data.studentRoll,
                createdAt: data.createdAt?.toDate() || new Date(),
                lastLogin: data.lastLogin?.toDate() || new Date(),
            };
        }
        return null;
    } catch {
        console.error("Error fetching user profile:");
        return null;
    }
};

/**
 * Create User Profile in Firestore
 */
export const createUserProfile = async (
    uid: string,
    email: string,
    displayName: string,
    role: UserRole = AUTH_ROLES.STUDENT,
    teacherId?: string,
    studentBatchName?: string,
    studentRoll?: string
): Promise<void> => {
    try {
        await setDoc(doc(db, COLLECTIONS.USERS, uid), {
            uid,
            email,
            displayName,
            role,
            teacherId: teacherId || null,
            studentBatchName: studentBatchName || null,
            studentRoll: studentRoll || null,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw new Error("Failed to create user profile");
    }
};

/**
 * Update Last Login Timestamp
 */
export const updateLastLogin = async (uid: string): Promise<void> => {
    try {
        await setDoc(doc(db, COLLECTIONS.USERS, uid), {
            lastLogin: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error updating last login:", error);
    }
};

/**
 * Link Student Profile
 */
export const linkStudentProfile = async (uid: string, batchName: string, roll: string): Promise<void> => {
    try {
        await setDoc(doc(db, COLLECTIONS.USERS, uid), {
            role: AUTH_ROLES.STUDENT,
            studentBatchName: batchName,
            studentRoll: roll,
        }, { merge: true });
    } catch (error) {
        console.error("Error linking student profile:", error);
        throw new Error("Failed to link student profile.");
    }
};

/**
 * Get user-friendly error messages
 */
const getAuthErrorMessage = (errorCode: string | undefined): string => {
    switch (errorCode) {
        case "auth/invalid-email":
            return "Invalid email address";
        case "auth/user-disabled":
            return "This account has been disabled";
        case "auth/user-not-found":
            return "No account found with this email";
        case "auth/wrong-password":
            return "Incorrect password";
        case "auth/invalid-credential":
            return "Invalid email or password";
        case "auth/email-already-in-use":
            return "An account with this email already exists. Please log in instead.";
        case "auth/weak-password":
            return "Password is too weak. Please use at least 6 characters.";
        case "auth/popup-closed-by-user":
            return "Sign-in popup was closed";
        case "auth/cancelled-popup-request":
            return "Sign-in cancelled";
        case "auth/network-request-failed":
            return "Network error. Please check your connection";
        case "auth/operation-not-allowed":
            return "Email/password registration is not enabled. Please contact the administrator.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please wait a few minutes and try again.";
        case "auth/requires-recent-login":
            return "Please log in again to complete this action.";
        case "auth/account-exists-with-different-credential":
            return "An account already exists with a different sign-in method.";
        case "auth/missing-email":
            return "Please provide an email address.";
        default:
            return errorCode
                ? `An error occurred (${errorCode}). Please try again.`
                : "An error occurred. Please try again";
    }
};
