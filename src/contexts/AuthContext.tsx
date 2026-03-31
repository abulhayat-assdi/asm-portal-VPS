"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthContextType, UserProfile } from "@/types/auth";
import * as authService from "@/services/authService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Synchronize Edge Middleware session cookie
                try {
                    const token = await firebaseUser.getIdToken();
                    document.cookie = `__session=${token}; path=/; max-age=86400; SameSite=Lax`;
                } catch (err) {
                    console.error("Failed to get token for session cookie", err);
                }

                // ✅ Fetch role exclusively from Firestore — no client-side overrides
                let profile = await authService.getUserProfile(firebaseUser.uid);

                // If a brand-new Google/Email user has no Firestore document yet,
                // create a default student profile. Admins/teachers must be
                // provisioned directly in Firestore (or via a Cloud Function).
                if (!profile) {
                    try {
                        await authService.createUserProfile(
                            firebaseUser.uid,
                            firebaseUser.email!,
                            firebaseUser.displayName || "Student",
                            "student"
                        );
                        profile = await authService.getUserProfile(firebaseUser.uid);
                    } catch (err) {
                        console.error("Failed to create fallback student profile:", err);
                    }
                }

                // Auto-assign `teacherId` and `profileImageUrl` from the teachers
                // directory — this is safe and read-only, no role changes involved.
                if (profile) {
                    try {
                        const { getAllTeachers } = await import("@/services/teacherService");
                        const allTeachers = await getAllTeachers();

                        const teacherMatch = allTeachers.find((t) =>
                            (profile!.email && t.email.toLowerCase() === profile!.email.toLowerCase()) ||
                            t.name === profile!.displayName
                        );

                        if (teacherMatch) {
                            if (!profile.teacherId && teacherMatch.teacherId && profile.role === "teacher") {
                                const { doc, updateDoc } = await import("firebase/firestore");
                                const { db } = await import("@/lib/firebase");

                                await updateDoc(doc(db, "users", profile.uid), {
                                    teacherId: teacherMatch.teacherId,
                                });

                                profile.teacherId = teacherMatch.teacherId;
                            }

                            // Attach profile image to session
                            if (teacherMatch.profileImageUrl) {
                                profile.profileImageUrl = teacherMatch.profileImageUrl;
                            }
                        }

                        // Fallback to Google photo if no teacher profile image
                        if (!profile.profileImageUrl && firebaseUser.photoURL) {
                            profile.profileImageUrl = firebaseUser.photoURL;
                        }
                    } catch (err) {
                        console.error("Failed to sync teacher metadata:", err);
                    }
                }

                setUserProfile(profile);
            } else {
                document.cookie = "__session=; path=/; max-age=0; SameSite=Lax";
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithEmail = async (email: string, password: string) => {
        setLoading(true);
        try {
            await authService.loginWithEmail(email, password);
            // We DO NOT set loading to false here.
            // The onAuthStateChanged listener will handle it once the profile is fetched.
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, password: string, name: string, batchName: string, roll: string) => {
        setLoading(true);
        try {
            await authService.registerWithEmail(email, password, name, batchName, roll);
            // We DO NOT set loading to false here.
            // listener handles it.
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const refreshProfile = async () => {
        if (user) {
            const profile = await authService.getUserProfile(user.uid);
            setUserProfile(profile);
        }
    };

    const loginWithGoogle = async () => {
        setLoading(true);
        try {
            await authService.loginWithGoogle();
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authService.logout();
            // onAuthStateChanged will set profile null and loading false
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const sendPasswordReset = async (email: string) => {
        await authService.sendPasswordReset(email);
    };

    const value: AuthContextType = {
        user,
        userProfile,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        sendPasswordReset,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
