"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthContextType, UserProfile } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch the current session profile from server
    const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
        try {
            const res = await fetch("/api/auth/profile");
            if (res.ok) {
                const profile = await res.json();
                profile.uid = profile.id; // Backward compat
                return profile;
            }
            return null;
        } catch {
            return null;
        }
    }, []);

    // Initialize: load session from cookie on mount
    useEffect(() => {
        let mounted = true;
        fetchProfile().then((profile) => {
            if (mounted) {
                setUser(profile);
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, [fetchProfile]);

    const loginWithEmail = async (email: string, password: string): Promise<UserProfile> => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed.");
            }

            data.user.uid = data.user.id;
            setUser(data.user);
            return data.user;
        } finally {
            setLoading(false);
        }
    };

    const registerWithEmail = async (
        email: string,
        password: string,
        name: string,
        batchName: string,
        roll: string
    ): Promise<UserProfile> => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name, batchName, roll }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed.");
            }

            data.user.uid = data.user.id;
            setUser(data.user);
            return data.user;
        } finally {
            setLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        setLoading(true);
        try {
            await fetch("/api/auth/logout", { method: "DELETE" });
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const sendPasswordReset = async (email: string): Promise<void> => {
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

    const refreshProfile = async (): Promise<void> => {
        const profile = await fetchProfile();
        setUser(profile);
    };

    const value: AuthContextType = {
        user,
        userProfile: user,
        loading,
        loginWithEmail,
        registerWithEmail,
        logout,
        sendPasswordReset,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
