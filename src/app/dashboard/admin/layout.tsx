"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION_META, PermissionKey } from "@/lib/permissions";

// Find the most specific matching permission for a given pathname
function getPermissionForPath(pathname: string): PermissionKey | null {
    const entries = Object.entries(PERMISSION_META) as [PermissionKey, typeof PERMISSION_META[PermissionKey]][];
    // Sort by path length descending so the most specific path wins
    const sorted = entries
        .filter(([, meta]) => meta.path.startsWith("/dashboard/admin"))
        .sort((a, b) => b[1].path.length - a[1].path.length);

    for (const [key, meta] of sorted) {
        if (pathname === meta.path || pathname.startsWith(meta.path + "/")) {
            return key;
        }
    }
    return null;
}

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { hasPermission, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#059669]" />
            </div>
        );
    }

    const permission = getPermissionForPath(pathname);

    if (permission && !hasPermission(permission)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-sm mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-500 text-sm">
                        আপনার এই পেইজে প্রবেশের অনুমতি নেই।<br />
                        Super Admin এর সাথে যোগাযোগ করুন।
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
