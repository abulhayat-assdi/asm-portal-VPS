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
                try {
                    // 1. Sync session cookie via secure server-side API (HttpOnly)
                    const token = await firebaseUser.getIdToken();
                    await fetch("/api/auth/session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idToken: token }),
                    });

                    // 2. Fetch enriched profile via Server API
                    const profileRes = await fetch("/api/auth/profile");
                    if (profileRes.ok) {
                        const profile = await profileRes.json();
                        setUserProfile(profile);
                    } else {
                        // Fallback to client-side fetch if API fails (unlikely)
                        const profile = await authService.getUserProfile(firebaseUser.uid);
                        setUserProfile(profile);
                    }
                } catch (err) {
                    console.error("[AuthContext] Sync failed:", err);
                    // Fallback to client-side fetch on error
                    const profile = await authService.getUserProfile(firebaseUser.uid);
                    setUserProfile(profile);
                }
            } else {
                // Clear session cookie via secure server-side API
                await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
                setUserProfile(null);
            }

            setLoading(false);
        });

        const refreshToken = async () => {
            if (auth.currentUser && document.visibilityState === 'visible') {
                try {
                    const token = await auth.currentUser.getIdToken(true);
                    await fetch("/api/auth/session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idToken: token }),
                    });
                    console.log("[AuthContext] Token refreshed automatically");
                } catch (err) {
                    console.error("[AuthContext] Token refresh failed:", err);
                }
            }
        };

        // Periodic token refresh (every 10 minutes)
        const refreshInterval = setInterval(refreshToken, 10 * 60 * 1000);

        // Also refresh when user comes back to the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') refreshToken();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            unsubscribe();
            clearInterval(refreshInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const loginWithEmail = async (email: string, password: string) => {
        setLoading(true);
        try {
            await authService.loginWithEmail(email, password);
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, password: string, name: string, batchName: string, roll: string) => {
        setLoading(true);
        try {
            await authService.registerWithEmail(email, password, name, batchName, roll);
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const refreshProfile = async () => {
        if (user) {
            const profileRes = await fetch("/api/auth/profile");
            if (profileRes.ok) {
                const profile = await profileRes.json();
                setUserProfile(profile);
            }
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
