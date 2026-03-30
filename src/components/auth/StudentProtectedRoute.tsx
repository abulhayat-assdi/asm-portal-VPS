"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in at all — send to student login
                router.push("/student-login");
            } else if (userProfile && userProfile.role !== "student") {
                // Logged in but not a student — send to teacher/admin dashboard
                router.push("/dashboard");
            }
        }
    }, [user, userProfile, loading, router]);

    // Show loading spinner while auth is resolving
    if (loading || !user || (userProfile && userProfile.role !== "student")) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
            </div>
        );
    }

    return <>{children}</>;
}
