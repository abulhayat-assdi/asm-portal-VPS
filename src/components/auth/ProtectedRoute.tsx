"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Show loading skeleton while checking auth
    if (loading) {
        return (
            <div className="w-full min-h-[50vh] space-y-6 animate-pulse p-4">
                {/* Page Header Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 mb-6 border-gray-200">
                    <div className="h-8 bg-gray-200 rounded-md w-48"></div>
                    <div className="h-10 bg-gray-200 rounded-md w-32 ml-auto"></div>
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 bg-white border border-gray-100 shadow-sm rounded-xl"></div>
                    ))}
                </div>

                {/* Main Content Area Skeleton */}
                <div className="bg-white border text-card-foreground border-gray-200 shadow-sm rounded-xl overflow-hidden mt-8">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="h-6 bg-gray-200 rounded-md w-1/4"></div>
                        <div className="h-8 bg-gray-200 rounded-md w-24"></div>
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4 items-center">
                                <div className="h-10 w-10 bg-gray-100 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 space-y-2 lg:flex lg:justify-between lg:items-center">
                                    <div className="h-4 bg-gray-100 rounded w-1/2 lg:w-1/3"></div>
                                    <div className="h-4 bg-gray-100 rounded w-1/3 lg:w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Don't render children if not authenticated
    if (!user) {
        return null;
    }

    return <>{children}</>;
}
