"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface HeroImage {
    id: string;
    url: string;
    storagePath: string;
    label: string | null;
    order: number;
    isActive: boolean;
    createdAt: string;
}

export default function HeroImagesPage() {
    const [images, setImages] = useState<HeroImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [labelInput, setLabelInput] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchImages = async () => {
        try {
            const res = await fetch("/api/admin/hero-images");
            const data = await res.json();
            if (res.ok) setImages(data.images || []);
        } catch {
            setMessage({ type: "error", text: "Failed to load images" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        if (labelInput.trim()) formData.append("label", labelInput.trim());

        try {
            const res = await fetch("/api/admin/hero-images", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                showMessage("success", "Image uploaded successfully!");
                setLabelInput("");
                if (fileInputRef.current) fileInputRef.current.value = "";
                fetchImages();
            } else {
                showMessage("error", data.error || "Upload failed");
            }
        } catch {
            showMessage("error", "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleToggleActive = async (img: HeroImage) => {
        const activeCount = images.filter(i => i.isActive).length;
        if (img.isActive && activeCount <= 1) {
            showMessage("error", "Cannot deactivate the last active image");
            return;
        }

        try {
            const res = await fetch(`/api/admin/hero-images/${img.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !img.isActive }),
            });
            if (res.ok) fetchImages();
        } catch {
            showMessage("error", "Failed to update");
        }
    };

    const handleMove = async (img: HeroImage, direction: "up" | "down") => {
        const sorted = [...images].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(i => i.id === img.id);
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;

        const other = sorted[swapIdx];
        try {
            await Promise.all([
                fetch(`/api/admin/hero-images/${img.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order: other.order }),
                }),
                fetch(`/api/admin/hero-images/${other.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order: img.order }),
                }),
            ]);
            fetchImages();
        } catch {
            showMessage("error", "Failed to reorder");
        }
    };

    const handleSaveLabel = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/hero-images/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: editLabel }),
            });
            if (res.ok) {
                setEditingId(null);
                fetchImages();
                showMessage("success", "Label updated");
            }
        } catch {
            showMessage("error", "Failed to update label");
        }
    };

    const handleDelete = async (img: HeroImage) => {
        const activeCount = images.filter(i => i.isActive).length;
        if (img.isActive && activeCount <= 1) {
            showMessage("error", "Cannot delete the last active hero image");
            return;
        }
        if (!confirm(`Delete image "${img.label || img.url}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/admin/hero-images/${img.id}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("success", "Image deleted");
                fetchImages();
            } else {
                const data = await res.json();
                showMessage("error", data.error || "Delete failed");
            }
        } catch {
            showMessage("error", "Delete failed");
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
                    সক্রিয় ইমেজ: <span className="font-bold text-green-600">{images.filter(i => i.isActive).length}</span> / {images.length}
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                    <span className="text-lg">{message.type === "success" ? "✓" : "✕"}</span>
                    <p className="font-semibold">{message.text}</p>
                </div>
            )}

            {/* Upload Card */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4 border-b pb-3">
                    <div className="w-2 h-6 bg-[#059669] rounded-full"></div>
                    <h2 className="text-lg font-bold text-gray-800">নতুন ইমেজ আপলোড করুন</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 space-y-3">
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
                    </div>
                    {uploading && (
                        <div className="flex items-center gap-2 text-[#059669] font-semibold mt-6">
                            <div className="w-5 h-5 border-2 border-[#059669]/30 border-t-[#059669] rounded-full animate-spin"></div>
                            আপলোড হচ্ছে...
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-3">ফাইল সিলেক্ট করলেই আপলোড শুরু হবে। প্রস্তাবিত সাইজ: 1920×1080px বা বড়।</p>
            </Card>

            {/* Images Grid */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="w-12 h-12 border-2 border-[#059669]/30 border-t-[#059669] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">ইমেজ লোড হচ্ছে...</p>
                </div>
            ) : sortedImages.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <div className="text-5xl mb-4">🖼️</div>
                    <p className="font-semibold">কোনো ইমেজ নেই। উপরে আপলোড করুন।</p>
                </div>
            ) : (
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
                                    />
                                    {!img.isActive && (
                                        <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold bg-gray-700 px-2 py-1 rounded">নিষ্ক্রিয়</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info & Controls */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                                        {img.isActive ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">সক্রিয়</span>
                                        ) : (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">নিষ্ক্রিয়</span>
                                        )}
                                    </div>

                                    {/* Label editing */}
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
                                            <button
                                                onClick={() => handleSaveLabel(img.id)}
                                                className="px-3 py-1.5 bg-[#059669] text-white text-sm rounded-lg hover:bg-[#047857]"
                                            >
                                                সেভ
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
                                            >
                                                বাতিল
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="text-sm font-semibold text-gray-700 truncate">
                                                {img.label || <span className="text-gray-400 italic">লেবেল নেই</span>}
                                            </p>
                                            <button
                                                onClick={() => { setEditingId(img.id); setEditLabel(img.label || ""); }}
                                                className="text-xs text-blue-500 hover:underline flex-shrink-0"
                                            >
                                                সম্পাদনা
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 truncate mb-3">{img.url}</p>

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        {/* Move up */}
                                        <button
                                            onClick={() => handleMove(img, "up")}
                                            disabled={idx === 0}
                                            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="উপরে সরান"
                                        >
                                            ↑ উপরে
                                        </button>
                                        {/* Move down */}
                                        <button
                                            onClick={() => handleMove(img, "down")}
                                            disabled={idx === sortedImages.length - 1}
                                            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="নিচে সরান"
                                        >
                                            ↓ নিচে
                                        </button>
                                        {/* Toggle active */}
                                        <button
                                            onClick={() => handleToggleActive(img)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${img.isActive ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"}`}
                                        >
                                            {img.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                                        </button>
                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(img)}
                                            className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                                        >
                                            মুছুন
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="pb-8 text-sm text-gray-400 text-center">
                শুধুমাত্র সক্রিয় ইমেজগুলো হোমপেইজে দেখাবে। ক্রম পরিবর্তন করলে সাথে সাথে হোমপেইজে প্রতিফলিত হবে।
            </div>
        </div>
    );
}
