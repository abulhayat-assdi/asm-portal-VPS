import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail,
    User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types/auth";

const googleProvider = new GoogleAuthProvider();

/**
 * Login with Email and Password
 */
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await updateLastLogin(userCredential.user.uid);
        return userCredential.user;
    } catch (error: any) {
        throw new Error(getAuthErrorMessage(error.code));
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
            // Create new user profile with default role "teacher"
            await createUserProfile(user.uid, user.email!, user.displayName || "User", "teacher");
        } else {
            await updateLastLogin(user.uid);
        }

        return user;
    } catch (error: any) {
        throw new Error(getAuthErrorMessage(error.code));
    }
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error("Failed to logout. Please try again.");
    }
};

/**
 * Send Password Reset Email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(getAuthErrorMessage(error.code));
    }
};

/**
 * Get User Profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                uid: data.uid,
                email: data.email,
                displayName: data.displayName,
                role: data.role as UserRole,
                teacherId: data.teacherId, // Read teacherId
                createdAt: data.createdAt?.toDate() || new Date(),
                lastLogin: data.lastLogin?.toDate() || new Date(),
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
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
    role: UserRole = "teacher",
    teacherId?: string
): Promise<void> => {
    try {
        await setDoc(doc(db, "users", uid), {
            uid,
            email,
            displayName,
            role,
            teacherId: teacherId || null, // Store teacherId
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        });
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
        // setDoc with merge:true safely updates even if document doesn't exist yet
        await setDoc(doc(db, "users", uid), {
            lastLogin: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error updating last login:", error);
    }
};

/**
 * Get user-friendly error messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
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
            return "Email already in use";
        case "auth/weak-password":
            return "Password is too weak";
        case "auth/popup-closed-by-user":
            return "Sign-in popup was closed";
        case "auth/cancelled-popup-request":
            return "Sign-in cancelled";
        case "auth/network-request-failed":
            return "Network error. Please check your connection";
        default:
            return "An error occurred. Please try again";
    }
};
