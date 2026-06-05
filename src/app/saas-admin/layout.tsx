"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminBasePath } from "./hooks";
import { Building2, LayoutDashboard, LogOut, Plus } from "lucide-react";


export default function SaasAdminLayout({ children }: { children: React.ReactNode }) {
    const [checking, setChecking] = useState(true);
    const base = useAdminBasePath();

    useEffect(() => {
        fetch("/api/saas/auth/verify")
            .then((r) => r.json())
            .then((data) => {
                if (!data.isSaasOwner) {
                    // Not the owner — redirect to the dedicated admin login page
                    window.location.replace("/login");
                } else {
                    setChecking(false);
                }
            })
            .catch(() => { window.location.replace("/login"); });
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
                    <button
                        onClick={async () => {
                            await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                            window.location.replace("/login");
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 text-sm transition-colors text-slate-400 w-full text-left"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto bg-slate-50">
                {children}
            </main>
        </div>
    );
}
