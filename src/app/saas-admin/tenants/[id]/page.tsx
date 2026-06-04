"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
    ArrowLeft, Globe, Users, GraduationCap, Power, Edit2, Save,
    X, Download, Palette, ToggleLeft, ToggleRight, LogIn, User,
} from "lucide-react";
import Link from "next/link";
import { ALL_FEATURES } from "@/lib/features";
import { useAdminBasePath } from "../../hooks";

// ── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
    id: string; slug: string; name: string; tagline: string | null;
    logo: string | null; status: string; plan: string;
    ownerName: string; ownerEmail: string; ownerPhone: string | null;
    primaryColor: string; accentColor: string;
    settings: Record<string, unknown>; createdAt: string;
}
interface Stats { students: number; teachers: number; users: number; batches: number; }
interface TenantUser {
    id: string; email: string; displayName: string; role: string;
    lastLoginAt: string | null; createdAt: string; profileImageUrl: string | null;
}

type Tab = "overview" | "branding" | "features" | "users";

const statusColor: Record<string, string> = {
    ACTIVE:    "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    TRIAL:     "bg-yellow-100 text-yellow-700",
    DELETED:   "bg-gray-100 text-gray-500",
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const base = useAdminBasePath();
    const [tenant, setTenant]   = useState<Tenant | null>(null);
    const [stats, setStats]     = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab]         = useState<Tab>("overview");
    const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);

    const showMsg = (text: string, ok = true) => {
        setMsg({ text, ok });
        setTimeout(() => setMsg(null), 3500);
    };

    const load = useCallback(() => {
        fetch(`/api/saas/tenants/${id}`)
            .then(r => r.json())
            .then(d => { setTenant(d.tenant); setStats(d.stats); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="p-8 text-slate-400">লোড হচ্ছে...</div>;
    if (!tenant) return <div className="p-8 text-red-500">Tenant পাওয়া যায়নি।</div>;

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "overview", label: "ওভারভিউ",    icon: <GraduationCap className="w-4 h-4" /> },
        { key: "branding", label: "ব্র্যান্ডিং", icon: <Palette className="w-4 h-4" /> },
        { key: "features", label: "ফিচার",       icon: <ToggleRight className="w-4 h-4" /> },
        { key: "users",    label: "ব্যবহারকারী", icon: <Users className="w-4 h-4" /> },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href={`${base}/`} className="text-slate-400 hover:text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800">{tenant.name}</h1>
                    <p className="text-slate-400 text-sm">{tenant.ownerEmail}</p>
                </div>
                <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${statusColor[tenant.status]}`}>
                    {tenant.status}
                </span>
            </div>

            {/* Message */}
            {msg && (
                <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {msg.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                            tab === t.key
                                ? "bg-white shadow text-slate-800"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === "overview" && (
                <OverviewTab
                    tenant={tenant} stats={stats} baseDomain={baseDomain}
                    tenantId={id} onMsg={showMsg} onStatusChange={load}
                />
            )}
            {tab === "branding" && (
                <BrandingTab tenant={tenant} tenantId={id} onMsg={showMsg} onSaved={load} />
            )}
            {tab === "features" && (
                <FeaturesTab tenant={tenant} tenantId={id} onMsg={showMsg} onSaved={load} />
            )}
            {tab === "users" && (
                <UsersTab tenantId={id} />
            )}
        </div>
    );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ tenant, stats, baseDomain, tenantId, onMsg, onStatusChange }: {
    tenant: Tenant; stats: Stats | null; baseDomain: string;
    tenantId: string; onMsg: (t: string, ok?: boolean) => void; onStatusChange: () => void;
}) {
    const [exporting, setExporting]   = useState(false);
    const [saving, setSaving]         = useState(false);
    const [editingSlug, setEditingSlug] = useState(false);
    const [newSlug, setNewSlug]       = useState(tenant.slug);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch(`/api/saas/export/${tenantId}`);
            if (!res.ok) { onMsg("Export ব্যর্থ হয়েছে।", false); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${tenant.slug}-export-${new Date().toISOString().split("T")[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { onMsg("Export করতে সমস্যা হয়েছে।", false); }
        finally { setExporting(false); }
    };

    const toggleStatus = async () => {
        setSaving(true);
        const newStatus = (tenant.status === "ACTIVE" || tenant.status === "TRIAL") ? "SUSPENDED" : "ACTIVE";
        const res = await fetch(`/api/saas/tenants/${tenantId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        setSaving(false);
        if (res.ok) { onMsg("স্ট্যাটাস পরিবর্তন হয়েছে।"); onStatusChange(); }
        else onMsg("পরিবর্তন ব্যর্থ হয়েছে।", false);
    };

    const saveSlug = async () => {
        setSaving(true);
        const res = await fetch(`/api/saas/tenants/${tenantId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: newSlug }),
        });
        const d = await res.json();
        setSaving(false);
        if (res.ok) { onMsg("Subdomain পরিবর্তন হয়েছে।"); setEditingSlug(false); onStatusChange(); }
        else onMsg(typeof d.error === "string" ? d.error : "পরিবর্তন ব্যর্থ।", false);
    };

    const handleImpersonate = async () => {
        const res = await fetch(`/api/saas/impersonate/${tenantId}`, { method: "POST" });
        const d = await res.json();
        if (!res.ok) { onMsg(d.error || "Admin login ব্যর্থ হয়েছে।", false); return; }
        window.open(d.impersonateUrl, "_blank");
    };

    return (
        <div className="space-y-4">
            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "ছাত্র",         value: stats.students, color: "bg-blue-50 text-blue-600" },
                        { label: "শিক্ষক",         value: stats.teachers, color: "bg-green-50 text-green-600" },
                        { label: "ব্যবহারকারী",   value: stats.users,    color: "bg-purple-50 text-purple-600" },
                        { label: "ব্যাচ",          value: stats.batches,  color: "bg-orange-50 text-orange-600" },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                            <p className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
                            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
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
                            <button onClick={() => setEditingSlug(true)} className="text-blue-600 text-xs flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> পরিবর্তন
                            </button>
                        )}
                    </div>
                    {editingSlug ? (
                        <div className="space-y-2">
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                                    className="flex-1 px-3 py-2 text-sm focus:outline-none" />
                                <span className="px-2 py-2 bg-slate-50 text-slate-400 text-xs border-l">.{baseDomain}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={saveSlug} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs">
                                    <Save className="w-3 h-3" /> সেভ
                                </button>
                                <button onClick={() => { setEditingSlug(false); setNewSlug(tenant.slug); }} className="flex items-center gap-1 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs">
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
                    <div className="space-y-2">
                        <button onClick={handleImpersonate}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition">
                            <LogIn className="w-4 h-4" /> Admin হিসেবে প্রবেশ করুন
                        </button>
                        <button onClick={handleExport} disabled={exporting}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition disabled:opacity-60">
                            <Download className="w-4 h-4" />
                            {exporting ? "Export হচ্ছে..." : "ডেটা Export করুন (.zip)"}
                        </button>
                        <button onClick={toggleStatus} disabled={saving || tenant.status === "DELETED"}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                                tenant.status === "ACTIVE" || tenant.status === "TRIAL"
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}>
                            <Power className="w-4 h-4" />
                            {tenant.status === "ACTIVE" || tenant.status === "TRIAL" ? "Suspend করুন" : "Activate করুন"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
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
    );
}

// ── Branding Tab ──────────────────────────────────────────────────────────────

function BrandingTab({ tenant, tenantId, onMsg, onSaved }: {
    tenant: Tenant; tenantId: string;
    onMsg: (t: string, ok?: boolean) => void; onSaved: () => void;
}) {
    const [form, setForm] = useState({
        name:         tenant.name,
        tagline:      tenant.tagline ?? "",
        primaryColor: tenant.primaryColor,
        accentColor:  tenant.accentColor,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const res = await fetch(`/api/saas/tenants/${tenantId}/branding`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setSaving(false);
        if (res.ok) { onMsg("ব্র্যান্ডিং সেভ হয়েছে।"); onSaved(); }
        else { const d = await res.json(); onMsg(d.error || "সেভ ব্যর্থ।", false); }
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-5 max-w-xl">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-500" /> ব্র্যান্ডিং সেটিংস
            </h3>

            <div>
                <label className="block text-xs text-slate-500 mb-1">প্রতিষ্ঠানের নাম</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
                <label className="block text-xs text-slate-500 mb-1">Tagline (ঐচ্ছিক)</label>
                <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                    placeholder="আমাদের দক্ষতাই আমাদের পরিচয়"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-2">প্রাইমারি রং</label>
                    <div className="flex items-center gap-3">
                        <input type="color" value={form.primaryColor}
                            onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                            className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                        <span className="text-sm font-mono text-slate-600">{form.primaryColor}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-2">অ্যাকসেন্ট রং</label>
                    <div className="flex items-center gap-3">
                        <input type="color" value={form.accentColor}
                            onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                            className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                        <span className="text-sm font-mono text-slate-600">{form.accentColor}</span>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg overflow-hidden border border-slate-200">
                <div className="px-4 py-2 text-white text-sm font-medium" style={{ backgroundColor: form.primaryColor }}>
                    {form.name} — প্রিভিউ
                </div>
                <div className="px-4 py-3" style={{ backgroundColor: form.accentColor }}>
                    <button className="px-3 py-1 rounded text-white text-xs" style={{ backgroundColor: form.primaryColor }}>
                        বোতাম
                    </button>
                </div>
            </div>

            <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60">
                <Save className="w-4 h-4" />
                {saving ? "সেভ হচ্ছে..." : "পরিবর্তন সেভ করুন"}
            </button>
        </div>
    );
}

// ── Features Tab ──────────────────────────────────────────────────────────────

function FeaturesTab({ tenant, tenantId, onMsg, onSaved }: {
    tenant: Tenant; tenantId: string;
    onMsg: (t: string, ok?: boolean) => void; onSaved: () => void;
}) {
    const currentFeatures = (tenant.settings as { features?: Record<string, boolean> })?.features ?? {};
    const [features, setFeatures] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const f of ALL_FEATURES) {
            init[f.key] = currentFeatures[f.key] !== false;
        }
        return init;
    });
    const [saving, setSaving] = useState(false);

    const toggle = (key: string) => setFeatures(f => ({ ...f, [key]: !f[key] }));

    const handleSave = async () => {
        setSaving(true);
        const res = await fetch(`/api/saas/tenants/${tenantId}/features`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(features),
        });
        setSaving(false);
        if (res.ok) { onMsg("Feature settings সেভ হয়েছে।"); onSaved(); }
        else onMsg("সেভ ব্যর্থ হয়েছে।", false);
    };

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                Feature বন্ধ করলে সেই module-এর মেনু ও পেজ ক্লায়েন্টের পোর্টালে আর দেখাবে না।
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
                {ALL_FEATURES.map(f => (
                    <div key={f.key} className="flex items-center justify-between px-5 py-4">
                        <div>
                            <p className="text-sm font-medium text-slate-800">{f.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                        </div>
                        <button
                            onClick={() => toggle(f.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                features[f.key]
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                        >
                            {features[f.key]
                                ? <><ToggleRight className="w-4 h-4" /> চালু</>
                                : <><ToggleLeft className="w-4 h-4" /> বন্ধ</>}
                        </button>
                    </div>
                ))}
            </div>

            <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60">
                <Save className="w-4 h-4" />
                {saving ? "সেভ হচ্ছে..." : "Feature Settings সেভ করুন"}
            </button>
        </div>
    );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ tenantId }: { tenantId: string }) {
    const [users, setUsers]   = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/saas/tenants/${tenantId}/users`)
            .then(r => r.json())
            .then(d => { setUsers(d.users || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [tenantId]);

    const roleColor: Record<string, string> = {
        super_admin: "bg-purple-100 text-purple-700",
        admin:       "bg-blue-100 text-blue-700",
        teacher:     "bg-green-100 text-green-700",
        student:     "bg-slate-100 text-slate-600",
    };

    if (loading) return <div className="p-8 text-center text-slate-400">লোড হচ্ছে...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4" /> ব্যবহারকারী ({users.length} জন)
                </h3>
            </div>
            {users.length === 0 ? (
                <div className="p-8 text-center text-slate-400">কোনো ব্যবহারকারী নেই</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {users.map(u => (
                        <div key={u.id} className="flex items-center gap-4 px-5 py-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                                {u.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{u.displayName}</p>
                                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColor[u.role] || "bg-slate-100 text-slate-600"}`}>
                                {u.role}
                            </span>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("bn-BD") : "—"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
