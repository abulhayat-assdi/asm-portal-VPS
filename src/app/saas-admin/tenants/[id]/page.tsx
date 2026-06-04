"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Globe, Users, GraduationCap, Power, Edit2, Save, X } from "lucide-react";
import Link from "next/link";

interface Tenant {
    id: string;
    slug: string;
    name: string;
    status: string;
    plan: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string | null;
    primaryColor: string;
    accentColor: string;
    createdAt: string;
}

interface Stats {
    students: number;
    teachers: number;
    users: number;
    batches: number;
}

export default function TenantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingSlug, setEditingSlug] = useState(false);
    const [newSlug, setNewSlug] = useState("");
    const [message, setMessage] = useState("");

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";

    useEffect(() => {
        fetch(`/api/saas/tenants/${id}`)
            .then((r) => r.json())
            .then((d) => {
                setTenant(d.tenant);
                setStats(d.stats);
                setNewSlug(d.tenant?.slug || "");
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const updateTenant = async (data: Partial<Tenant>) => {
        setSaving(true);
        setMessage("");
        const res = await fetch(`/api/saas/tenants/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const d = await res.json();
        setSaving(false);
        if (res.ok) {
            setTenant(d.tenant);
            setMessage("সফলভাবে আপডেট হয়েছে।");
            setEditingSlug(false);
        } else {
            setMessage(typeof d.error === "string" ? d.error : "আপডেট ব্যর্থ হয়েছে।");
        }
    };

    const toggleStatus = () => {
        if (!tenant) return;
        const newStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        updateTenant({ status: newStatus as Tenant["status"] });
    };

    if (loading) return <div className="p-8 text-slate-400">লোড হচ্ছে...</div>;
    if (!tenant) return <div className="p-8 text-red-500">Tenant পাওয়া যায়নি।</div>;

    const statusColor: Record<string, string> = {
        ACTIVE: "bg-green-100 text-green-700",
        SUSPENDED: "bg-red-100 text-red-700",
        TRIAL: "bg-yellow-100 text-yellow-700",
        DELETED: "bg-gray-100 text-gray-500",
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/saas-admin" className="text-slate-400 hover:text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{tenant.name}</h1>
                    <p className="text-slate-400 text-sm">{tenant.ownerEmail}</p>
                </div>
                <span className={`ml-2 px-3 py-0.5 rounded-full text-xs font-medium ${statusColor[tenant.status]}`}>
                    {tenant.status}
                </span>
            </div>

            {message && (
                <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.includes("ব্যর্থ") || message.includes("সমস্যা") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                    {message}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "ছাত্র", value: stats.students, icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
                        { label: "শিক্ষক", value: stats.teachers, icon: Users, color: "text-green-600 bg-green-50" },
                        { label: "ব্যবহারকারী", value: stats.users, icon: Users, color: "text-purple-600 bg-purple-50" },
                        { label: "ব্যাচ", value: stats.batches, icon: GraduationCap, color: "text-orange-600 bg-orange-50" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{value}</p>
                            <p className="text-xs text-slate-500">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {/* Subdomain */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Subdomain
                        </h3>
                        {!editingSlug && (
                            <button onClick={() => setEditingSlug(true)}
                                className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> পরিবর্তন
                            </button>
                        )}
                    </div>
                    {editingSlug ? (
                        <div className="space-y-2">
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                <input
                                    type="text"
                                    value={newSlug}
                                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                                />
                                <span className="px-2 py-2 bg-slate-50 text-slate-400 text-xs border-l">
                                    .{baseDomain}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => updateTenant({ slug: newSlug })} disabled={saving}
                                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-60">
                                    <Save className="w-3 h-3" /> সেভ
                                </button>
                                <button onClick={() => { setEditingSlug(false); setNewSlug(tenant.slug); }}
                                    className="flex items-center gap-1 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50">
                                    <X className="w-3 h-3" /> বাতিল
                                </button>
                            </div>
                        </div>
                    ) : (
                        <a href={`https://${tenant.slug}.${baseDomain}`} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm font-mono">
                            {tenant.slug}.{baseDomain}
                        </a>
                    )}
                </div>

                {/* Controls */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-700 mb-3">নিয়ন্ত্রণ</h3>
                    <div className="space-y-3">
                        <button
                            onClick={toggleStatus}
                            disabled={saving || tenant.status === "DELETED"}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                                tenant.status === "ACTIVE" || tenant.status === "TRIAL"
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                        >
                            <Power className="w-4 h-4" />
                            {tenant.status === "ACTIVE" || tenant.status === "TRIAL" ? "Tenant Suspend করুন" : "Tenant Activate করুন"}
                        </button>

                        <a href={`https://${tenant.slug}.${baseDomain}/dashboard`} target="_blank" rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                            পোর্টালে যান →
                        </a>
                    </div>
                </div>

                {/* Tenant Info */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 md:col-span-2">
                    <h3 className="font-semibold text-slate-700 mb-3">তথ্য</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-400">মালিকের নাম:</span> <span className="text-slate-700">{tenant.ownerName}</span></div>
                        <div><span className="text-slate-400">Email:</span> <span className="text-slate-700">{tenant.ownerEmail}</span></div>
                        <div><span className="text-slate-400">ফোন:</span> <span className="text-slate-700">{tenant.ownerPhone || "—"}</span></div>
                        <div><span className="text-slate-400">Plan:</span> <span className="capitalize text-slate-700">{tenant.plan}</span></div>
                        <div><span className="text-slate-400">তৈরির তারিখ:</span> <span className="text-slate-700">{new Date(tenant.createdAt).toLocaleDateString("bn-BD")}</span></div>
                        <div>
                            <span className="text-slate-400">রং:</span>
                            <span className="inline-flex items-center gap-1.5 ml-1">
                                <span className="w-4 h-4 rounded-full border border-slate-200 inline-block" style={{ backgroundColor: tenant.primaryColor }} />
                                <span className="text-slate-700 font-mono text-xs">{tenant.primaryColor}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
