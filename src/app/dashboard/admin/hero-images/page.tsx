"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Card from "@/components/ui/Card";

interface HeroImage {
    id: string;
    url: string;
    storagePath: string;
    label: string | null;
    order: number;
    isActive: boolean;
    createdAt: string;
}

type Msg = { type: "success" | "error"; text: string };

export default function HeroImagesPage() {
    const [images, setImages] = useState<HeroImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [message, setMessage] = useState<Msg | null>(null);
    const [labelInput, setLabelInput] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showMsg = (type: Msg["type"], text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const fetchImages = async () => {
        setApiError(null);
        try {
            const res = await fetch("/api/admin/hero-images");
            const data = await res.json();
            if (res.ok) {
                setImages(data.images || []);
            } else {
                const errText = data.error || `Server error (${res.status})`;
                setApiError(errText);
                console.error("[HeroImages] API error:", errText);
            }
        } catch (e) {
            const errText = e instanceof Error ? e.message : "Network error";
            setApiError(errText);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchImages(); }, []);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const res = await fetch("/api/admin/hero-images/seed", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                showMsg("success", data.message || "সিড সম্পন্ন!");
                await fetchImages();
            } else {
                showMsg("error", data.error || "সিড ব্যর্থ হয়েছে");
            }
        } catch {
            showMsg("error", "সিড ব্যর্থ হয়েছে");
        } finally {
            setSeeding(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        if (labelInput.trim()) formData.append("label", labelInput.trim());

        try {
            const res = await fetch("/api/admin/hero-images", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok) {
                showMsg("success", "ইমেজ আপলোড সম্পন্ন!");
                setLabelInput("");
                if (fileInputRef.current) fileInputRef.current.value = "";
                await fetchImages();
            } else {
                showMsg("error", data.error || "আপলোড ব্যর্থ হয়েছে");
            }
        } catch {
            showMsg("error", "আপলোড ব্যর্থ হয়েছে");
        } finally {
            setUploading(false);
        }
    };

    const handleToggleActive = async (img: HeroImage) => {
        const activeCount = images.filter(i => i.isActive).length;
        if (img.isActive && activeCount <= 1) {
            showMsg("error", "কমপক্ষে ১টি ইমেজ সক্রিয় থাকতে হবে");
            return;
        }
        const res = await fetch(`/api/admin/hero-images/${img.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !img.isActive }),
        });
        if (res.ok) fetchImages();
        else showMsg("error", "আপডেট ব্যর্থ হয়েছে");
    };

    const handleMove = async (img: HeroImage, direction: "up" | "down") => {
        const sorted = [...images].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(i => i.id === img.id);
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;
        const other = sorted[swapIdx];
        await Promise.all([
            fetch(`/api/admin/hero-images/${img.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order: other.order }),
            }),
            fetch(`/api/admin/hero-images/${other.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order: img.order }),
            }),
        ]);
        fetchImages();
    };

    const handleSaveLabel = async (id: string) => {
        const res = await fetch(`/api/admin/hero-images/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: editLabel }),
        });
        if (res.ok) { setEditingId(null); fetchImages(); showMsg("success", "লেবেল আপডেট হয়েছে"); }
        else showMsg("error", "লেবেল আপডেট ব্যর্থ");
    };

    const handleDelete = async (img: HeroImage) => {
        const activeCount = images.filter(i => i.isActive).length;
        if (img.isActive && activeCount <= 1) {
            showMsg("error", "শেষ সক্রিয় ইমেজটি মুছে ফেলা যাবে না");
            return;
        }
        if (!confirm(`"${img.label || img.url}" মুছে ফেলবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।`)) return;
        const res = await fetch(`/api/admin/hero-images/${img.id}`, { method: "DELETE" });
        if (res.ok) { showMsg("success", "ইমেজ মুছে ফেলা হয়েছে"); fetchImages(); }
        else {
            const d = await res.json();
            showMsg("error", d.error || "মুছে ফেলা ব্যর্থ");
        }
    };

    const sortedImages = [...images].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hero Images</h1>
                    <p className="text-gray-500 mt-1">হোমপেইজের ব্যাকগ্রাউন্ড স্লাইডার ইমেজ ম্যানেজ করুন</p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border">
                    সক্রিয়: <span className="font-bold text-green-600">{images.filter(i => i.isActive).length}</span> / {images.length}
                </div>
            </div>

            {/* Feedback message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                    <span className="text-lg font-bold">{message.type === "success" ? "✓" : "✕"}</span>
                    <p className="font-semibold">{message.text}</p>
                </div>
            )}

            {/* API Error panel */}
            {apiError && (
                <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                    <p className="font-bold text-red-700 mb-1">API Error: {apiError}</p>
                    {apiError.includes("403") || apiError.toLowerCase().includes("forbidden") ? (
                        <p className="text-sm text-red-600">অ্যাক্সেস অনুমতি নেই। Admin হিসেবে লগইন আছেন কি?</p>
                    ) : (
                        <>
                            <p className="text-sm text-red-600 mb-3">
                                সম্ভাবনা: hero_images টেবিল তৈরি হয়নি (migration চলেনি)।
                                নিচের বাটনে ক্লিক করলে টেবিল তৈরি হবে ও ডিফল্ট ইমেজ যুক্ত হবে।
                            </p>
                            <button
                                onClick={handleSeed}
                                disabled={seeding}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
                            >
                                {seeding ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> টেবিল তৈরি হচ্ছে...</>
                                ) : (
                                    <>🔧 টেবিল তৈরি করুন ও ডিফল্ট ইমেজ যোগ করুন</>
                                )}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Upload Card */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4 border-b pb-3">
                    <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                    <h2 className="text-lg font-bold text-gray-800">নতুন ইমেজ আপলোড করুন</h2>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">লেবেল (ঐচ্ছিক)</label>
                        <input
                            type="text"
                            value={labelInput}
                            onChange={(e) => setLabelInput(e.target.value)}
                            placeholder="যেমন: Summer Campaign Slide"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">ইমেজ ফাইল (JPG/PNG/WebP, সর্বোচ্চ 5MB)</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleUpload}
                            disabled={uploading}
                            className="w-full px-4 py-2 border rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
                        />
                    </div>
                    {uploading && (
                        <div className="flex items-center gap-2 text-[#059669] font-semibold">
                            <div className="w-4 h-4 border-2 border-[#059669]/30 border-t-[#059669] rounded-full animate-spin"></div>
                            আপলোড হচ্ছে...
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-3">ফাইল সিলেক্ট করলেই আপলোড শুরু হবে। প্রস্তাবিত সাইজ: 1920×1080px বা বড়।</p>
            </Card>

            {/* Image list */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="w-12 h-12 border-2 border-[#059669]/30 border-t-[#059669] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">ইমেজ লোড হচ্ছে...</p>
                </div>
            ) : !apiError && sortedImages.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">🖼️</div>
                    <p className="text-gray-500 font-semibold mb-4">কোনো ইমেজ নেই।</p>
                    <button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto disabled:opacity-60"
                    >
                        {seeding ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> লোড হচ্ছে...</>
                        ) : (
                            <>🔧 ডিফল্ট ৩টি ইমেজ যোগ করুন</>
                        )}
                    </button>
                </div>
            ) : (
                !apiError && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-700">বর্তমান ইমেজসমূহ ({sortedImages.length}টি)</h2>
                        {sortedImages.map((img, idx) => (
                            <Card key={img.id} className={`p-4 ${!img.isActive ? "opacity-60" : ""}`}>
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                    {/* Thumbnail */}
                                    <div className="relative w-full sm:w-48 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        <Image
                                            src={img.url}
                                            alt={img.label || `Hero ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="192px"
                                            unoptimized
                                        />
                                        {!img.isActive && (
                                            <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold bg-gray-700 px-2 py-1 rounded">নিষ্ক্রিয়</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                                            {img.isActive
                                                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">সক্রিয়</span>
                                                : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">নিষ্ক্রিয়</span>
                                            }
                                        </div>

                                        {editingId === img.id ? (
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === "Enter" && handleSaveLabel(img.id)}
                                                />
                                                <button onClick={() => handleSaveLabel(img.id)} className="px-3 py-1.5 bg-[#059669] text-white text-sm rounded-lg hover:bg-[#047857]">সেভ</button>
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">বাতিল</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-sm font-semibold text-gray-700 truncate">
                                                    {img.label || <span className="text-gray-400 italic">লেবেল নেই</span>}
                                                </p>
                                                <button onClick={() => { setEditingId(img.id); setEditLabel(img.label || ""); }} className="text-xs text-blue-500 hover:underline flex-shrink-0">সম্পাদনা</button>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 truncate mb-3">{img.url}</p>

                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => handleMove(img, "up")} disabled={idx === 0}
                                                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                                                ↑ উপরে
                                            </button>
                                            <button onClick={() => handleMove(img, "down")} disabled={idx === sortedImages.length - 1}
                                                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                                                ↓ নিচে
                                            </button>
                                            <button onClick={() => handleToggleActive(img)}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${img.isActive ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"}`}>
                                                {img.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                                            </button>
                                            <button onClick={() => handleDelete(img)}
                                                className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100">
                                                মুছুন
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
            )}

            <div className="pb-8 text-sm text-gray-400 text-center">
                শুধুমাত্র সক্রিয় ইমেজগুলো হোমপেইজে দেখাবে।
            </div>
        </div>
    );
}
