"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthContextType, UserProfile } from "@/types/auth";
import * as authService from "@/services/authService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Pre-approved admin list
const APPROVED_ADMINS: Record<string, string> = {
    "mohammadabulhayatt@gmail.com": "Abul Hayat",
};

// ✅ Pre-approved teacher list
// এখানে ইমেইল → নাম ম্যাপিং। নতুন teacher যোগ করতে এই list এ add করুন।
const APPROVED_TEACHERS: Record<string, string> = {
    "rezvhe@gmail.com": "Mohammad Abu Zabar Rezvhe",
    "sunil.somudro@gmail.com": "Golam Kibria",
    "shibalshariar@gmail.com": "Shaibal Shariar",
    "mnumaruf@gmail.com": "Md. Nesar Uddin",
    "naim.sm207@gmail.com": "M M Naim Amran",
};

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
                // Fetch user profile from Firestore
                let profile = await authService.getUserProfile(firebaseUser.uid);

                // Check if the email is in any of the approved lists
                let assignedName: string | undefined;
                let assignedRole: "admin" | "teacher" | undefined;
                
                if (firebaseUser.email) {
                    const email = firebaseUser.email.toLowerCase();
                    if (APPROVED_ADMINS[email]) {
                        assignedName = APPROVED_ADMINS[email];
                        assignedRole = "admin";
                    } else if (APPROVED_TEACHERS[email]) {
                        assignedName = APPROVED_TEACHERS[email];
                        assignedRole = "teacher";
                    }
                }

                // If no profile exists OR it's a partial profile OR the role/name is incorrect
                // we force create/update the profile to ensure proper access
                if (assignedName && assignedRole) {
                    if (!profile || profile.role !== assignedRole || profile.displayName !== assignedName) {
                        await authService.createUserProfile(
                            firebaseUser.uid,
                            firebaseUser.email!,
                            assignedName,
                            assignedRole
                        );
                        // Re-fetch to get the newly created profile
                        profile = await authService.getUserProfile(firebaseUser.uid);
                    }
                } else if (!profile && !assignedRole) {
                    // Not an admin/teacher — must be a student whose Firestore write failed; create now
                    await authService.createUserProfile(
                        firebaseUser.uid,
                        firebaseUser.email!,
                        firebaseUser.displayName || "Student",
                        "student"
                    );
                    profile = await authService.getUserProfile(firebaseUser.uid);
                }

                // Auto-assign `teacherId` and `profileImageUrl`
                if (profile) {
                    try {
                        const { getAllTeachers } = await import("@/services/teacherService");
                        const allTeachers = await getAllTeachers();
                        
                        const teacherMatch = allTeachers.find(t => 
                            (profile!.email && t.email.toLowerCase() === profile!.email.toLowerCase()) || 
                            t.name === profile!.displayName
                        );

                        if (teacherMatch) {
                            if (!profile.teacherId && teacherMatch.teacherId && profile.role === "teacher") {
                                const { doc, updateDoc } = await import("firebase/firestore");
                                const { db } = await import("@/lib/firebase");
                                
                                await updateDoc(doc(db, "users", profile.uid), {
                                    teacherId: teacherMatch.teacherId
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
