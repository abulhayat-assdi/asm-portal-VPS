"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe, User, Mail, Lock, Phone, CheckCircle } from "lucide-react";

export default function NewTenantPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState<{ url: string; name: string } | null>(null);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        ownerPhone: "",
        plan: "basic",
        primaryColor: "#1a56db",
    });

    const handleSlugChange = (value: string) => {
        // Auto-format to valid slug
        const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
        setForm((f) => ({ ...f, slug }));
    };

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await fetch("/api/saas/tenants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(typeof data.error === "string" ? data.error : "কিছু একটা সমস্যা হয়েছে।");
            return;
        }

        setSuccess({ url: data.portalUrl, name: form.name });
    };

    if (success) {
        return (
            <div className="p-6 max-w-lg mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Tenant তৈরি সফল!</h2>
                    <p className="text-slate-600 mb-4">{success.name} এর পোর্টাল প্রস্তুত।</p>
                    <a href={success.url} target="_blank" rel="noopener noreferrer"
                        className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition mb-3 text-sm font-medium">
                        পোর্টাল খুলুন →
                    </a>
                    <br />
                    <button onClick={() => router.push("/saas-admin")}
                        className="text-slate-500 hover:underline text-sm mt-2">
                        Dashboard-এ ফিরুন
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">নতুন Tenant তৈরি করুন</h1>
                <p className="text-slate-500 text-sm mt-1">একটি নতুন প্রতিষ্ঠানের জন্য পোর্টাল সেট-আপ করুন</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
                {/* Institution info */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        <Building2 className="w-4 h-4 inline mr-1" /> প্রতিষ্ঠানের নাম *
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="ABC Educational Institute"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        <Globe className="w-4 h-4 inline mr-1" /> Subdomain (পোর্টালের URL) *
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                        <input
                            type="text"
                            required
                            placeholder="abc-institute"
                            value={form.slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm focus:outline-none"
                        />
                        <span className="px-3 py-2 bg-slate-50 text-slate-400 text-sm border-l border-slate-200 whitespace-nowrap">
                            .{baseDomain}
                        </span>
                    </div>
                    {form.slug && (
                        <p className="text-xs text-blue-600 mt-1">
                            পোর্টাল: https://{form.slug}.{baseDomain}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                        <select
                            value={form.plan}
                            onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            প্রাইমারি রং
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={form.primaryColor}
                                onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                                className="w-10 h-9 rounded border border-slate-200 cursor-pointer p-0.5"
                            />
                            <span className="text-xs text-slate-500 font-mono">{form.primaryColor}</span>
                        </div>
                    </div>
                </div>

                {/* Super admin info */}
                <div className="border-t border-slate-100 pt-4">
                    <h3 className="font-medium text-slate-700 mb-3 text-sm">Super Admin (প্রতিষ্ঠানের মালিক)</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                <User className="w-3 h-3 inline mr-1" /> পুরো নাম *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Mohammed Hasan"
                                value={form.ownerName}
                                onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                <Mail className="w-3 h-3 inline mr-1" /> Email *
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="owner@abc-institute.com"
                                value={form.ownerEmail}
                                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                <Lock className="w-3 h-3 inline mr-1" /> Password * (কমপক্ষে ৮ অক্ষর)
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                placeholder="••••••••"
                                value={form.ownerPassword}
                                onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                <Phone className="w-3 h-3 inline mr-1" /> ফোন (ঐচ্ছিক)
                            </label>
                            <input
                                type="text"
                                placeholder="+880 1XXX-XXXXXX"
                                value={form.ownerPhone}
                                onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => router.back()}
                        className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition">
                        বাতিল
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60">
                        {loading ? "তৈরি হচ্ছে..." : "Tenant তৈরি করুন"}
                    </button>
                </div>
            </form>
        </div>
    );
}
