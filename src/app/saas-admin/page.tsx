"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, GraduationCap, Plus, TrendingUp } from "lucide-react";

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

export default function SaasAdminDashboard() {
    const [tenants, setTenants] = useState<TenantWithStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/saas/tenants")
            .then((r) => r.json())
            .then((d) => { setTenants(d.tenants || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const totalStudents = tenants.reduce((s, t) => s + t.stats.students, 0);
    const totalTeachers = tenants.reduce((s, t) => s + t.stats.teachers, 0);
    const activeTenants = tenants.filter((t) => t.status === "ACTIVE" || t.status === "TRIAL").length;

    const statusColor: Record<string, string> = {
        ACTIVE: "bg-green-100 text-green-700",
        SUSPENDED: "bg-red-100 text-red-700",
        TRIAL: "bg-yellow-100 text-yellow-700",
        DELETED: "bg-gray-100 text-gray-500",
    };

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">SaaS Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">সব tenant পরিচালনা করুন</p>
                </div>
                <Link href="/saas-admin/tenants/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" />
                    নতুন Tenant
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg"><Building2 className="w-5 h-5 text-blue-600" /></div>
                        <div>
                            <p className="text-sm text-slate-500">মোট Tenant</p>
                            <p className="text-2xl font-bold text-slate-800">{tenants.length}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{activeTenants} active</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg"><GraduationCap className="w-5 h-5 text-green-600" /></div>
                        <div>
                            <p className="text-sm text-slate-500">মোট ছাত্র</p>
                            <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">সব tenant মিলিয়ে</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
                        <div>
                            <p className="text-sm text-slate-500">মোট শিক্ষক</p>
                            <p className="text-2xl font-bold text-slate-800">{totalTeachers}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">সব tenant মিলিয়ে</p>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-700">সব Tenant</h2>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-slate-400">লোড হচ্ছে...</div>
                ) : tenants.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">কোনো tenant নেই</div>
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
                                    <th className="px-4 py-3 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tenants.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{t.name}</div>
                                            <div className="text-xs text-slate-400">{t.ownerEmail}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <a href={`https://${t.slug}.${baseDomain}`} target="_blank" rel="noopener noreferrer"
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
                                            <Link href={`/saas-admin/tenants/${t.id}`}
                                                className="text-blue-600 hover:underline text-xs font-medium">
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
