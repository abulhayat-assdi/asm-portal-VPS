"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, LayoutDashboard, LogOut, Plus } from "lucide-react";

// When accessed via admin.tasm-skill.asf.bd the rewrite maps:
//   /          → /saas-admin
//   /tenants   → /saas-admin/tenants
// So links must use the pre-rewrite paths (without /saas-admin prefix).
// When accessed via tasm-skill.asf.bd/saas-admin, links need the full prefix.
function isAdminSubdomain(): boolean {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname;
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";
    // Production: admin.tasm-skill.asf.bd  |  Development: admin.localhost
    return hostname === `admin.${baseDomain}` || hostname === "admin.localhost";
}

export function useAdminBasePath() {
    const [base, setBase] = useState("/saas-admin");
    useEffect(() => {
        setBase(isAdminSubdomain() ? "" : "/saas-admin");
    }, []);
    return base;
}

function useMainDomainUrl() {
    const [url, setUrl] = useState("/dashboard");
    useEffect(() => {
        if (isAdminSubdomain()) {
            const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";
            const isLocal = window.location.hostname === "admin.localhost";
            setUrl(isLocal ? "http://localhost:3000/dashboard" : `https://${baseDomain}/dashboard`);
        }
    }, []);
    return url;
}

function getLoginUrl(): string {
    if (typeof window === "undefined") return "/login";
    const isLocal = window.location.hostname.includes("localhost");
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";
    return isLocal ? "http://localhost:3000/login" : `https://${baseDomain}/login`;
}

export default function SaasAdminLayout({ children }: { children: React.ReactNode }) {
    const [checking, setChecking] = useState(true);
    const base = useAdminBasePath();
    const mainPortalUrl = useMainDomainUrl();

    useEffect(() => {
        fetch("/api/saas/auth/verify")
            .then((r) => r.json())
            .then((data) => {
                if (!data.isSaasOwner) {
                    // Hard redirect to main-domain login (avoid rewrite loop)
                    window.location.href = getLoginUrl();
                } else {
                    setChecking(false);
                }
            })
            .catch(() => { window.location.href = getLoginUrl(); });
    }, []);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-lg">লোড হচ্ছে...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-60 bg-slate-800 text-white flex flex-col shrink-0">
                <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-400" />
                        <div>
                            <p className="font-bold text-sm">SaaS Admin</p>
                            <p className="text-xs text-slate-400">TASM Platform</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <Link href={`${base}/`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 text-sm transition-colors">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <Link href={`${base}/tenants`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 text-sm transition-colors">
                        <Building2 className="w-4 h-4" />
                        সব Tenant
                    </Link>
                    <Link href={`${base}/tenants/new`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 text-sm transition-colors">
                        <Plus className="w-4 h-4" />
                        নতুন Tenant যোগ
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <a href={mainPortalUrl}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 text-sm transition-colors text-slate-400">
                        <LogOut className="w-4 h-4" />
                        মূল Portal-এ যান
                    </a>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto bg-slate-50">
                {children}
            </main>
        </div>
    );
}
