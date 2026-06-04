"use client";

import { useEffect, useState, useRef } from "react";
import { Palette, Globe, Image, Save, CheckCircle } from "lucide-react";

interface TenantSettings {
    id: string;
    name: string;
    tagline: string | null;
    logo: string | null;
    primaryColor: string;
    accentColor: string;
    slug: string;
    plan: string;
}

export default function BrandingSettingsPage() {
    const [tenant, setTenant] = useState<TenantSettings | null>(null);
    const [form, setForm] = useState({
        name: "",
        tagline: "",
        primaryColor: "#1a56db",
        accentColor: "#f3f4f6",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/tenant/settings")
            .then((r) => r.json())
            .then((d) => {
                if (d.tenant) {
                    setTenant(d.tenant);
                    setForm({
                        name: d.tenant.name || "",
                        tagline: d.tenant.tagline || "",
                        primaryColor: d.tenant.primaryColor || "#1a56db",
                        accentColor: d.tenant.accentColor || "#f3f4f6",
                    });
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSaved(false);
        const res = await fetch("/api/tenant/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const d = await res.json();
        setSaving(false);
        if (res.ok) {
            setSaved(true);
            setTenant(d.tenant);
            setTimeout(() => setSaved(false), 3000);
        } else {
            setError(typeof d.error === "string" ? d.error : "আপডেট ব্যর্থ হয়েছে।");
        }
    };

    if (loading) return <div className="p-6 text-slate-400">লোড হচ্ছে...</div>;

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">ব্র্যান্ডিং ও সেটিংস</h1>
                <p className="text-slate-500 text-sm mt-1">আপনার পোর্টালের নাম, রং ও পরিচয় কাস্টমাইজ করুন</p>
            </div>

            {saved && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    সফলভাবে সেভ হয়েছে!
                </div>
            )}
            {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="space-y-4">
                {/* Organization name */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" /> প্রতিষ্ঠানের পরিচয়
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">প্রতিষ্ঠানের নাম</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Tagline (ঐচ্ছিক)</label>
                            <input
                                type="text"
                                placeholder="আমাদের দক্ষতাই আমাদের পরিচয়"
                                value={form.tagline}
                                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {tenant && (
                            <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500">
                                পোর্টাল URL: <span className="font-mono text-blue-600">{tenant.slug}.{baseDomain}</span>
                                <span className="ml-2 text-slate-400">(subdomain পরিবর্তন করতে admin-কে অনুরোধ করুন)</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Color scheme */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-purple-500" /> রঙের থিম
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-2">প্রাইমারি রং (বোতাম, লিঙ্ক)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={form.primaryColor}
                                    onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                                    className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                                />
                                <span className="text-sm font-mono text-slate-600">{form.primaryColor}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-2">অ্যাকসেন্ট রং (ব্যাকগ্রাউন্ড)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={form.accentColor}
                                    onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                                    className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                                />
                                <span className="text-sm font-mono text-slate-600">{form.accentColor}</span>
                            </div>
                        </div>
                    </div>
                    {/* Preview */}
                    <div className="mt-4 rounded-lg overflow-hidden border border-slate-200">
                        <div className="px-4 py-2 text-white text-sm font-medium" style={{ backgroundColor: form.primaryColor }}>
                            {form.name || "আপনার পোর্টাল"} — প্রিভিউ
                        </div>
                        <div className="px-4 py-3 text-sm" style={{ backgroundColor: form.accentColor }}>
                            <button className="px-3 py-1 rounded text-white text-xs" style={{ backgroundColor: form.primaryColor }}>
                                বোতাম
                            </button>
                        </div>
                    </div>
                </div>

                {/* Plan info */}
                {tenant && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Image className="w-4 h-4 text-green-500" /> Plan তথ্য
                        </h3>
                        <p className="text-sm text-slate-600">
                            আপনার বর্তমান plan: <span className="capitalize font-semibold text-blue-600">{tenant.plan}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Plan পরিবর্তনের জন্য admin-এর সাথে যোগাযোগ করুন।</p>
                    </div>
                )}
            </div>

            <div className="mt-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium text-sm disabled:opacity-60"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "সেভ হচ্ছে..." : "পরিবর্তন সেভ করুন"}
                </button>
            </div>
        </div>
    );
}
