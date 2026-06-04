"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Building2 } from "lucide-react";
import { useAdminBasePath } from "../layout";

interface TenantWithStats {
    id: string;
    slug: string;
    name: string;
    status: string;
    plan: string;
    ownerEmail: string;
    createdAt: string;
    primaryColor: string;
    stats: { students: number; teachers: number; users: number };
}

const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    TRIAL: "bg-yellow-100 text-yellow-700",
    DELETED: "bg-gray-100 text-gray-500",
};

export default function TenantsListPage() {
    const [tenants, setTenants] = useState<TenantWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const base = useAdminBasePath();

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";

    useEffect(() => {
        fetch("/api/saas/tenants")
            .then((r) => r.json())
            .then((d) => { setTenants(d.tenants || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = tenants.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase()) ||
        t.ownerEmail.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">সব Tenant</h1>
                    <p className="text-slate-500 text-sm mt-1">মোট {tenants.length} টি পোর্টাল</p>
                </div>
                <Link href={`${base}/tenants/new`}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" />
                    নতুন Tenant
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="নাম, subdomain বা email দিয়ে খুঁজুন..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">লোড হচ্ছে...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400">{search ? "কোনো ফলাফল নেই" : "এখনো কোনো tenant নেই"}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">প্রতিষ্ঠান</th>
                                    <th className="px-4 py-3 text-left">Subdomain</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Plan</th>
                                    <th className="px-4 py-3 text-center">ছাত্র</th>
                                    <th className="px-4 py-3 text-center">শিক্ষক</th>
                                    <th className="px-4 py-3 text-left"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg shrink-0"
                                                    style={{ backgroundColor: t.primaryColor }} />
                                                <div>
                                                    <div className="font-medium text-slate-800">{t.name}</div>
                                                    <div className="text-xs text-slate-400">{t.ownerEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <a href={`https://${t.slug}.${baseDomain}`} target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-xs font-mono">
                                                {t.slug}.{baseDomain}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[t.status] || "bg-gray-100 text-gray-500"}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 capitalize text-slate-600">{t.plan}</td>
                                        <td className="px-4 py-3 text-center text-slate-700">{t.stats.students}</td>
                                        <td className="px-4 py-3 text-center text-slate-700">{t.stats.teachers}</td>
                                        <td className="px-4 py-3">
                                            <Link href={`${base}/tenants/${t.id}`}
                                                className="text-blue-600 hover:underline text-xs font-medium whitespace-nowrap">
                                                পরিচালনা →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
